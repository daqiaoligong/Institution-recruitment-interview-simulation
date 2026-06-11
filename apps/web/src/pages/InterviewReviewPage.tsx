import type { InterviewAnswer } from "@humian/shared";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { generateInterviewReport, reviewAnswer } from "../services/aiService";
import { getAudioBlob } from "../services/indexedDbService";
import { useHistoryStore } from "../stores/historyStore";
import { useJobProfileStore } from "../stores/jobProfileStore";

function ReviewAnswerCard({
  answer,
  sessionId,
  onTranscriptChange,
  onReview
}: {
  answer: InterviewAnswer;
  sessionId: string;
  onTranscriptChange: (sessionId: string, answerId: string, transcript: string) => void;
  onReview: (answer: InterviewAnswer, transcript: string) => Promise<void>;
}) {
  const [audioUrl, setAudioUrl] = useState<string>();
  const [audioMessage, setAudioMessage] = useState(answer.audioBlobId ? "正在读取录音" : "本题暂无录音");
  const [transcript, setTranscript] = useState(answer.transcript);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    setTranscript(answer.transcript);
  }, [answer.transcript]);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    async function loadAudio() {
      if (!answer.audioBlobId) {
        setAudioUrl(undefined);
        setAudioMessage("本题暂无录音");
        return;
      }

      const blob = await getAudioBlob(answer.audioBlobId);
      if (cancelled) return;

      if (!blob) {
        setAudioUrl(undefined);
        setAudioMessage("未找到本地录音文件");
        return;
      }

      objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
      setAudioMessage("录音已加载");
    }

    void loadAudio();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [answer.audioBlobId]);

  async function handleReview() {
    setIsReviewing(true);
    try {
      onTranscriptChange(sessionId, answer.id, transcript);
      await onReview(answer, transcript);
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <article className="review-answer-card">
      <div className="review-answer-heading">
        <h3>第 {answer.sortOrder} 题</h3>
        <span>{answer.durationSeconds ? `${answer.durationSeconds} 秒` : "未记录时长"}</span>
      </div>
      <p>{answer.questionContentSnapshot}</p>

      <div className="audio-player-block">
        {audioUrl ? <audio controls src={audioUrl} /> : <span>{audioMessage}</span>}
        {answer.audioSizeBytes ? <em>{Math.round(answer.audioSizeBytes / 1024)} KB</em> : null}
      </div>

      <label className="transcript-editor">
        转写文本
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          onBlur={() => onTranscriptChange(sessionId, answer.id, transcript)}
          placeholder="未识别到有效作答，可在这里手动补充"
        />
      </label>
      {answer.transcriptStatus && answer.transcriptStatus !== "completed" ? (
        <div className="transcript-note">{answer.transcriptMessage ?? "转写暂不可用，可手动补充文本后生成点评。"}</div>
      ) : null}

      <button className="secondary-button" onClick={handleReview} disabled={isReviewing}>
        <Sparkles size={16} />
        {isReviewing ? "点评中" : "生成单题点评"}
      </button>
    </article>
  );
}

export function InterviewReviewPage() {
  const { id } = useParams();
  const session = useHistoryStore((state) => state.getSession(id ?? ""));
  const updateAnswerTranscript = useHistoryStore((state) => state.updateAnswerTranscript);
  const updateAnswerReview = useHistoryStore((state) => state.updateAnswerReview);
  const updateReport = useHistoryStore((state) => state.updateReport);
  const profile = useJobProfileStore((state) => state.profile);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string>();
  const [isReporting, setIsReporting] = useState(false);
  const [message, setMessage] = useState("");

  const selected = session?.answers.find((answer) => answer.id === selectedAnswerId) ?? session?.answers[0];

  if (!session) {
    return (
      <section className="page-center">
        <h1>未找到面试记录</h1>
        <p>请先完成一场模拟面试。</p>
      </section>
    );
  }

  const activeSession = session;

  async function handleReview(answer: InterviewAnswer, transcript: string) {
    const review = await reviewAnswer({
      question: answer.questionContentSnapshot,
      transcript,
      questionType: undefined,
      jobProfile: profile
    });
    updateAnswerReview(activeSession.id, answer.id, review);
    setSelectedAnswerId(answer.id);
    setMessage("单题 AI 点评已生成");
  }

  async function handleReport() {
    setIsReporting(true);
    setMessage("");
    try {
      const report = await generateInterviewReport({
        answers: activeSession.answers.map((answer) => ({
          question: answer.questionContentSnapshot,
          transcript: answer.transcript,
          aiReview: answer.aiReview
        })),
        jobProfile: profile
      });
      updateReport(activeSession.id, report);
      setMessage("整场 AI 报告已生成");
    } catch (error) {
      setMessage(error instanceof Error ? `整场报告生成失败：${error.message}` : "整场报告生成失败");
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <section className="review-page">
      <div>
        <h1>面试结束复盘</h1>
        <p className="muted">逐题查看题目、录音、转写文本、AI 评语与答题思路</p>
        {message && <div className="success-message">{message}</div>}
        <div className="review-answer-list">
          {activeSession.answers.map((answer) => (
            <ReviewAnswerCard
              answer={answer}
              key={answer.id}
              sessionId={activeSession.id}
              onTranscriptChange={updateAnswerTranscript}
              onReview={handleReview}
            />
          ))}
        </div>
      </div>
      <aside className="review-side">
        <section className="panel">
          <h2>AI 评语</h2>
          <p>{selected?.aiReview?.comment ?? "点击左侧“生成单题点评”后展示。"}</p>
          <ul>
            {selected?.aiReview?.suggestions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="panel">
          <h2>AI 答题思路</h2>
          <p>{selected?.aiReview?.thinking ?? "暂无答题思路"}</p>
        </section>
        <section className="panel">
          <h2>整场总评</h2>
          <p>{activeSession.report?.summary ?? "点击下方按钮生成整场报告。"}</p>
          <div className="score-row">
            <span>总分 {activeSession.report?.totalScore ?? "-"}</span>
            <span>岗位匹配 {activeSession.report?.matchScore ?? "-"}</span>
            <span>稳定度 {activeSession.report?.stabilityScore ?? "-"}</span>
          </div>
          <button className="primary-button block-link" onClick={handleReport} disabled={isReporting}>
            <Sparkles size={16} />
            {isReporting ? "生成中" : "生成整场报告"}
          </button>
        </section>
      </aside>
    </section>
  );
}
