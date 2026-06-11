import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInterviewDto, SaveAnswerDto } from "./dto";

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInterviewDto) {
    const interview = await this.prisma.interview.create({
      data: {
        userId,
        mode: dto.mode,
        sourceType: dto.sourceType,
        totalSeconds: dto.totalSeconds,
        status: "answering",
        startedAt: new Date()
      }
    });

    return {
      id: interview.id,
      userId: interview.userId,
      mode: interview.mode,
      sourceType: interview.sourceType,
      totalSeconds: interview.totalSeconds,
      status: interview.status,
      questions: dto.questions,
      answers: [],
      startedAt: interview.startedAt?.toISOString() ?? interview.createdAt.toISOString(),
      createdAt: interview.createdAt.toISOString()
    };
  }

  async list(userId: string) {
    const interviews = await this.prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { answers: { orderBy: { sortOrder: "asc" } }, report: true }
    });
    return interviews.map((interview) => this.toInterview(interview));
  }

  async get(userId: string, id: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        answers: { orderBy: { sortOrder: "asc" }, include: { audioFile: true, aiReview: true } },
        report: true
      }
    });
    if (!interview) throw new NotFoundException("Interview not found");
    if (interview.userId !== userId) throw new ForbiddenException("Forbidden");
    return this.toInterview(interview);
  }

  async saveAnswer(userId: string, interviewId: string, dto: SaveAnswerDto) {
    await this.assertOwner(userId, interviewId);
    const answer = await this.prisma.interviewAnswer.upsert({
      where: { interviewId_sortOrder: { interviewId, sortOrder: dto.sortOrder } },
      update: {
        transcript: dto.transcript ?? "",
        durationSeconds: dto.durationSeconds,
        questionContentSnapshot: dto.questionContentSnapshot
      },
      create: {
        interviewId,
        questionId: dto.questionId,
        questionContentSnapshot: dto.questionContentSnapshot,
        transcript: dto.transcript ?? "",
        durationSeconds: dto.durationSeconds,
        sortOrder: dto.sortOrder
      }
    });
    return this.toAnswer(answer);
  }

  async finish(userId: string, id: string) {
    await this.assertOwner(userId, id);
    const interview = await this.prisma.interview.update({
      where: { id },
      data: { status: "finished", endedAt: new Date() },
      include: { answers: { orderBy: { sortOrder: "asc" } }, report: true }
    });
    return this.toInterview(interview);
  }

  private async assertOwner(userId: string, interviewId: string) {
    const interview = await this.prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new NotFoundException("Interview not found");
    if (interview.userId !== userId) throw new ForbiddenException("Forbidden");
  }

  private toInterview(interview: {
    id: string;
    userId: string;
    mode: string;
    sourceType: string;
    totalSeconds: number;
    status: string;
    startedAt: Date | null;
    endedAt: Date | null;
    createdAt: Date;
    answers: Array<Parameters<InterviewsService["toAnswer"]>[0]>;
    report?: {
      totalScore: number | null;
      matchScore: number | null;
      stabilityScore: number | null;
      summary: string;
      details: unknown;
    } | null;
  }) {
    return {
      id: interview.id,
      userId: interview.userId,
      mode: interview.mode,
      sourceType: interview.sourceType,
      totalSeconds: interview.totalSeconds,
      status: interview.status,
      startedAt: interview.startedAt?.toISOString() ?? interview.createdAt.toISOString(),
      endedAt: interview.endedAt?.toISOString(),
      answers: interview.answers.map((answer) => this.toAnswer(answer)),
      report: interview.report
        ? {
            totalScore: interview.report.totalScore ?? undefined,
            matchScore: interview.report.matchScore ?? undefined,
            stabilityScore: interview.report.stabilityScore ?? undefined,
            summary: interview.report.summary,
            details: interview.report.details ?? {}
          }
        : undefined
    };
  }

  private toAnswer(answer: {
    id: string;
    questionId: string | null;
    questionContentSnapshot: string;
    transcript: string | null;
    durationSeconds: number | null;
    sortOrder: number;
    audioFile?: {
      fileUrl: string;
      mimeType: string;
      sizeBytes: bigint | null;
      durationSeconds: number | null;
    } | null;
    aiReview?: {
      score: number | null;
      comment: string;
      thinking: string;
      strengths: unknown;
      weaknesses: unknown;
      suggestions: unknown;
    } | null;
  }) {
    return {
      id: answer.id,
      questionId: answer.questionId ?? undefined,
      questionTitle: `第 ${answer.sortOrder} 题`,
      questionContentSnapshot: answer.questionContentSnapshot,
      transcript: answer.transcript ?? "",
      durationSeconds: answer.durationSeconds ?? undefined,
      audioUrl: answer.audioFile?.fileUrl,
      audioMimeType: answer.audioFile?.mimeType,
      audioSizeBytes: answer.audioFile?.sizeBytes ? Number(answer.audioFile.sizeBytes) : undefined,
      sortOrder: answer.sortOrder,
      aiReview: answer.aiReview
        ? {
            score: answer.aiReview.score ?? undefined,
            comment: answer.aiReview.comment,
            thinking: answer.aiReview.thinking,
            strengths: Array.isArray(answer.aiReview.strengths) ? answer.aiReview.strengths : [],
            weaknesses: Array.isArray(answer.aiReview.weaknesses) ? answer.aiReview.weaknesses : [],
            suggestions: Array.isArray(answer.aiReview.suggestions) ? answer.aiReview.suggestions : []
          }
        : undefined
    };
  }
}
