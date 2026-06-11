import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { answerReviewPrompt } from "./prompts/answer-review.prompt";
import { interviewReportPrompt } from "./prompts/interview-report.prompt";
import { jobQuestionPrompt } from "./prompts/job-question.prompt";
import { GenerateQuestionsDto, GenerateReportDto, ReviewAnswerDto, TranscribeAudioDto } from "./dto";

const NlsFileTransClient = require("@alicloud/nls-filetrans-2018-08-17");

export interface AiReviewResult {
  score?: number;
  comment: string;
  thinking: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface AiReportResult {
  totalScore?: number;
  matchScore?: number;
  stabilityScore?: number;
  summary: string;
  details: Record<string, unknown>;
}

export interface TranscribeAudioResult {
  transcript: string;
  status: "completed" | "unavailable" | "failed";
  message?: string;
}

interface CompatibleChatCompletion {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
}

interface AliyunTaskResult {
  StatusText?: string;
  TaskId?: string;
  Result?: {
    Sentences?: Array<{
      Text?: string;
    }>;
  };
}

@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async reviewAnswer(userId: string, dto: ReviewAnswerDto): Promise<AiReviewResult> {
    const result = await this.callJson<AiReviewResult>(
      answerReviewPrompt,
      {
        question: dto.question,
        transcript: dto.transcript ?? "",
        questionType: dto.questionType,
        jobProfile: dto.jobProfile
      },
      this.fallbackReview(dto)
    );

    const normalized = this.normalizeReview(result);
    if (dto.interviewAnswerId) {
      await this.saveReview(userId, dto.interviewAnswerId, normalized);
    }
    return normalized;
  }

  async generateQuestions(dto: GenerateQuestionsDto) {
    const result = await this.callJson<{ questions: Array<{ content: string; type?: string }> }>(
      jobQuestionPrompt,
      dto,
      {
        questions: Array.from({ length: 10 }, (_, index) => ({
          content: `请结合${dto.jobTitle || "报考岗位"}的岗位职责，谈谈你对公共服务意识的理解和实践思路。（${index + 1}）`,
          type: "jobMatching"
        }))
      }
    );

    const questions = Array.isArray(result.questions) ? result.questions : [];
    return {
      questions: questions.slice(0, 10).map((question, index) => ({
        content: String(question.content || `岗位匹配题 ${index + 1}`),
        type: question.type || "jobMatching"
      }))
    };
  }

  async generateReport(userId: string, dto: GenerateReportDto): Promise<AiReportResult> {
    const result = await this.callJson<AiReportResult>(
      interviewReportPrompt,
      {
        answers: dto.answers,
        jobProfile: dto.jobProfile
      },
      this.fallbackReport(dto)
    );

    const normalized = this.normalizeReport(result);
    if (dto.interviewId) {
      await this.saveReport(userId, dto.interviewId, normalized);
    }
    return normalized;
  }

  async transcribeAudio(dto: TranscribeAudioDto): Promise<TranscribeAudioResult> {
    const provider = this.config.get<string>("ASR_PROVIDER");
    if (!provider) {
      return {
        transcript: "",
        status: "unavailable",
        message: "录音已保存，但当前还没有配置音频转写服务。"
      };
    }

    const normalizedProvider = provider.toLowerCase();
    if (["qwen3-asr-flash", "dashscope", "bailian", "aliyun-bailian"].includes(normalizedProvider)) {
      return this.transcribeWithQwenAsr(dto);
    }

    if (normalizedProvider === "aliyun") {
      return this.transcribeWithAliyun(dto);
    }

    this.logger.warn(`ASR provider ${provider} is configured but no driver has been implemented yet.`);
    return {
      transcript: "",
      status: "failed",
      message: "音频转写服务驱动尚未实现，请先接入具体 ASR 服务。"
    };
  }

  private async transcribeWithQwenAsr(dto: TranscribeAudioDto): Promise<TranscribeAudioResult> {
    const apiKey = this.config.get<string>("DASHSCOPE_API_KEY");
    const baseUrl =
      this.config.get<string>("DASHSCOPE_BASE_URL") || "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const model = this.config.get<string>("DASHSCOPE_ASR_MODEL") || "qwen3-asr-flash";

    if (!apiKey) {
      return {
        transcript: "",
        status: "unavailable",
        message: "百炼 ASR 未配置，请填写 DASHSCOPE_API_KEY。"
      };
    }

    if (!dto.audioData) {
      return {
        transcript: "",
        status: "unavailable",
        message: "qwen3-asr-flash 需要 Base64 音频数据。"
      };
    }

    const audio = this.normalizeAudioData(dto.audioData, dto.mimeType);
    if (!audio) {
      return {
        transcript: "",
        status: "failed",
        message: "音频数据格式不正确。"
      };
    }

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "input_audio",
                  input_audio: {
                    data: audio.base64,
                    format: audio.format
                  }
                },
                {
                  type: "text",
                  text: "请将这段中文面试作答音频转写为简体中文文本。只输出转写正文，不要添加总结或评价。"
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.warn(`Qwen ASR request failed: ${response.status} ${detail}`);
        return {
          transcript: "",
          status: "failed",
          message: `百炼 ASR 请求失败：${response.status}`
        };
      }

      const json = (await response.json()) as CompatibleChatCompletion;
      const transcript = this.extractCompatibleContent(json).trim();
      return {
        transcript,
        status: "completed",
        message: transcript ? undefined : "未识别到有效语音文本。"
      };
    } catch (error) {
      this.logger.warn(`Qwen ASR request error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        transcript: "",
        status: "failed",
        message: error instanceof Error ? error.message : "百炼 ASR 请求失败。"
      };
    }
  }

  private normalizeAudioData(audioData: string, mimeType?: string) {
    const match = audioData.match(/^data:([^;]+);base64,(.+)$/);
    const type = match?.[1] ?? mimeType;
    const base64 = match?.[2] ?? audioData;
    if (!base64.trim()) return undefined;

    return {
      base64,
      format: this.audioFormatFromMime(type)
    };
  }

  private audioFormatFromMime(mimeType?: string) {
    if (!mimeType) return "webm";
    if (mimeType.includes("wav")) return "wav";
    if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
    if (mimeType.includes("ogg") || mimeType.includes("opus")) return "ogg";
    if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
    if (mimeType.includes("webm")) return "webm";
    return "webm";
  }

  private extractCompatibleContent(json: CompatibleChatCompletion) {
    const content = json.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => item.text)
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }

  private async transcribeWithAliyun(dto: TranscribeAudioDto): Promise<TranscribeAudioResult> {
    const appKey = this.config.get<string>("ALIYUN_NLS_APP_KEY");
    const accessKeyId = this.config.get<string>("ALIYUN_ACCESS_KEY_ID");
    const accessKeySecret = this.config.get<string>("ALIYUN_ACCESS_KEY_SECRET");
    const endpoint = this.config.get<string>("ALIYUN_NLS_ENDPOINT") || "http://filetrans.cn-shanghai.aliyuncs.com";
    const timeoutMs = Number(this.config.get<string>("ALIYUN_NLS_TIMEOUT_MS") || 180000);
    const pollIntervalMs = Number(this.config.get<string>("ALIYUN_NLS_POLL_INTERVAL_MS") || 10000);

    if (!appKey || !accessKeyId || !accessKeySecret) {
      return {
        transcript: "",
        status: "unavailable",
        message: "阿里云录音文件识别未配置完整，请填写 ALIYUN_NLS_APP_KEY、ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET。"
      };
    }

    const fileLink = this.resolvePublicFileUrl(dto.fileUrl);
    if (!fileLink) {
      return {
        transcript: "",
        status: "unavailable",
        message: "阿里云录音文件识别需要公网可访问的音频 URL。请配置 PUBLIC_ASSET_BASE_URL，或将录音上传到 OSS 后再转写。"
      };
    }

    const client = new NlsFileTransClient({
      accessKeyId,
      accessKeySecret,
      endpoint,
      apiVersion: "2018-08-17"
    });

    try {
      const task = JSON.stringify({
        appkey: appKey,
        file_link: fileLink,
        version: "4.0",
        enable_words: false,
        enable_sample_rate_adaptive: true
      });
      const submitResponse = (await client.submitTask(
        { Task: task },
        { method: "POST", timeout: 30000 }
      )) as AliyunTaskResult;

      if (submitResponse.StatusText !== "SUCCESS" || !submitResponse.TaskId) {
        return {
          transcript: "",
          status: "failed",
          message: `阿里云转写任务提交失败：${submitResponse.StatusText || "UNKNOWN"}`
        };
      }

      const startedAt = Date.now();
      while (Date.now() - startedAt < timeoutMs) {
        await this.delay(pollIntervalMs);
        const result = (await client.getTaskResult(
          { TaskId: submitResponse.TaskId },
          { timeout: 30000 }
        )) as AliyunTaskResult;

        if (result.StatusText === "RUNNING" || result.StatusText === "QUEUEING") {
          continue;
        }

        if (result.StatusText === "SUCCESS" || result.StatusText === "SUCCESS_WITH_NO_VALID_FRAGMENT") {
          return {
            transcript: this.extractAliyunTranscript(result),
            status: "completed",
            message: result.StatusText === "SUCCESS_WITH_NO_VALID_FRAGMENT" ? "未识别到有效语音片段。" : undefined
          };
        }

        return {
          transcript: "",
          status: "failed",
          message: `阿里云转写失败：${result.StatusText || "UNKNOWN"}`
        };
      }

      return {
        transcript: "",
        status: "failed",
        message: "阿里云转写超时，请稍后重试。"
      };
    } catch (error) {
      this.logger.warn(`Aliyun ASR request error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        transcript: "",
        status: "failed",
        message: error instanceof Error ? error.message : "阿里云转写请求失败。"
      };
    }
  }

  private resolvePublicFileUrl(fileUrl?: string) {
    if (!fileUrl) return undefined;
    if (/^https?:\/\//i.test(fileUrl)) {
      return this.isLocalUrl(fileUrl) ? undefined : fileUrl;
    }

    const baseUrl = this.config.get<string>("PUBLIC_ASSET_BASE_URL");
    if (!baseUrl) return undefined;
    const resolved = `${baseUrl.replace(/\/$/, "")}/${fileUrl.replace(/^\//, "")}`;
    return this.isLocalUrl(resolved) ? undefined : resolved;
  }

  private isLocalUrl(url: string) {
    return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:\d+)?/i.test(url);
  }

  private extractAliyunTranscript(result: AliyunTaskResult) {
    return (result.Result?.Sentences ?? [])
      .map((sentence) => sentence.Text?.trim())
      .filter(Boolean)
      .join("\n");
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async callJson<T>(systemPrompt: string, payload: unknown, fallback: T): Promise<T> {
    const apiKey = this.config.get<string>("DEEPSEEK_API_KEY");
    if (!apiKey) return fallback;

    const baseUrl = this.config.get<string>("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";
    const model = this.config.get<string>("DEEPSEEK_MODEL") || "deepseek-chat";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(payload, null, 2) }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        this.logger.warn(`DeepSeek request failed: ${response.status} ${await response.text()}`);
        return fallback;
      }

      const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return fallback;
      return this.parseJson<T>(content, fallback);
    } catch (error) {
      this.logger.warn(`DeepSeek request error: ${error instanceof Error ? error.message : String(error)}`);
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseJson<T>(content: string, fallback: T): T {
    try {
      return JSON.parse(content) as T;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return fallback;
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return fallback;
      }
    }
  }

  private normalizeReview(result: Partial<AiReviewResult>): AiReviewResult {
    return {
      score: typeof result.score === "number" ? Math.max(0, Math.min(100, Math.round(result.score))) : undefined,
      comment: result.comment || "AI 暂未生成有效评语。",
      thinking: result.thinking || "建议按照“表态、分析、对策、总结”的结构展开。",
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map(String) : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions.map(String) : []
    };
  }

  private normalizeReport(result: Partial<AiReportResult>): AiReportResult {
    return {
      totalScore: typeof result.totalScore === "number" ? Math.round(result.totalScore) : undefined,
      matchScore: typeof result.matchScore === "number" ? Math.round(result.matchScore) : undefined,
      stabilityScore: typeof result.stabilityScore === "number" ? Math.round(result.stabilityScore) : undefined,
      summary: result.summary || "AI 暂未生成有效整场总评。",
      details: result.details && typeof result.details === "object" ? result.details : {}
    };
  }

  private fallbackReview(dto: ReviewAnswerDto): AiReviewResult {
    const hasAnswer = Boolean(dto.transcript?.trim());
    return {
      score: hasAnswer ? 78 : 55,
      comment: hasAnswer
        ? "当前为开发期兜底评语：作答已形成基本表达，可继续强化题目回应、岗位结合和上海本地治理案例。"
        : "当前为开发期兜底评语：未检测到有效作答文本，建议先补充转写或手动作答文本后再复盘。",
      thinking: `可按“明确态度、分析原因、提出对策、结合岗位总结”的结构回答。本题核心：${dto.question}`,
      strengths: hasAnswer ? ["有基本作答内容", "可以继续提炼结构"] : ["已完成题目录入"],
      weaknesses: hasAnswer ? ["案例支撑不足", "岗位匹配表达还可加强"] : ["缺少有效作答文本"],
      suggestions: ["补充上海基层治理案例", "用分点表达提升清晰度", "结尾回扣岗位职责"]
    };
  }

  private fallbackReport(dto: GenerateReportDto): AiReportResult {
    const answered = dto.answers.filter((answer) => answer.transcript?.trim()).length;
    return {
      totalScore: answered ? 78 : 58,
      matchScore: answered ? 80 : 60,
      stabilityScore: answered ? 75 : 55,
      summary: answered
        ? "当前为开发期兜底总评：整场作答具备基本完整度，后续应强化结构化表达、案例支撑和岗位匹配。"
        : "当前为开发期兜底总评：有效作答较少，建议先完成完整表达训练，再进行精细复盘。",
      details: {
        answeredCount: answered,
        strengths: ["训练流程完整"],
        risks: ["作答文本不足会影响 AI 评价质量"],
        nextSteps: ["补充转写文本", "按题型进行专项练习"]
      }
    };
  }

  private async saveReview(userId: string, answerId: string, review: AiReviewResult) {
    const answer = await this.prisma.interviewAnswer.findUnique({
      where: { id: answerId },
      include: { interview: true }
    });
    if (!answer) throw new NotFoundException("Answer not found");
    if (answer.interview.userId !== userId) throw new ForbiddenException("Forbidden");

    await this.prisma.aiReview.upsert({
      where: { interviewAnswerId: answerId },
      update: {
        score: review.score,
        comment: review.comment,
        thinking: review.thinking,
        strengths: review.strengths as Prisma.InputJsonValue,
        weaknesses: review.weaknesses as Prisma.InputJsonValue,
        suggestions: review.suggestions as Prisma.InputJsonValue
      },
      create: {
        interviewAnswerId: answerId,
        score: review.score,
        comment: review.comment,
        thinking: review.thinking,
        strengths: review.strengths as Prisma.InputJsonValue,
        weaknesses: review.weaknesses as Prisma.InputJsonValue,
        suggestions: review.suggestions as Prisma.InputJsonValue
      }
    });
  }

  private async saveReport(userId: string, interviewId: string, report: AiReportResult) {
    const interview = await this.prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new NotFoundException("Interview not found");
    if (interview.userId !== userId) throw new ForbiddenException("Forbidden");

    await this.prisma.aiReport.upsert({
      where: { interviewId },
      update: {
        totalScore: report.totalScore,
        matchScore: report.matchScore,
        stabilityScore: report.stabilityScore,
        summary: report.summary,
        details: report.details as Prisma.InputJsonValue
      },
      create: {
        interviewId,
        totalScore: report.totalScore,
        matchScore: report.matchScore,
        stabilityScore: report.stabilityScore,
        summary: report.summary,
        details: report.details as Prisma.InputJsonValue
      }
    });
  }
}
