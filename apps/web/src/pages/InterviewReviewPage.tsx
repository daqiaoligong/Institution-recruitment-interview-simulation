import type { InterviewAnswer } from "@humian/shared";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAudioBlob } from "../services/indexedDbService";
import { useHistoryStore } from "../stores/historyStore";

function ReviewAnswerCard({
  answer,
  sessionId,
  onTranscriptChange
}: {
  answer: InterviewAnswer;
  sessionId: string;
  onTranscriptChange: (sessionId: string, answerId: string, transcript: string) => void;
}) {
  const [audioUrl, setAudioUrl] = useState<string>();
  const [audioMessage, setAudioMessage] = useState(answer.audioBlobId ? "正在读取录音" : "本题暂无录音");
  const [transcript, setTranscript] = useState(answer.transcript);

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
    </article>
  );
}

export function InterviewReviewPage() {
  const { id } = useParams();
  const session = useHistoryStore((state) => state.getSession(id ?? ""));
  const updateAnswerTranscript = useHistoryStore((state) => state.updateAnswerTranscript);
  const selected = session?.answers[0];

  if (!session) {
    return (
      <section className="page-center">
        <h1>未找到面试记录</h1>
        <p>请先完成一场模拟面试。</p>
      </section>
    );
  }

  return (
    <section className="review-page">
      <div>
        <h1>面试结束复盘</h1>
        <p className="muted">逐题查看题目、录音、转写文本、AI 评语与答题思路</p>
        <div className="review-answer-list">
          {session.answers.map((answer) => (
            <ReviewAnswerCard
              answer={answer}
              key={answer.id}
              sessionId={session.id}
              onTranscriptChange={updateAnswerTranscript}
            />
          ))}
        </div>
      </div>
      <aside className="review-side">
        <section className="panel">
          <h2>AI 评语</h2>
          <p>{selected?.aiReview?.comment ?? "AI 评语生成中"}</p>
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
          <p>{session.report?.summary}</p>
          <div className="score-row">
            <span>总分 {session.report?.totalScore ?? "-"}</span>
            <span>岗位匹配 {session.report?.matchScore ?? "-"}</span>
            <span>稳定度 {session.report?.stabilityScore ?? "-"}</span>
          </div>
        </section>
      </aside>
    </section>
  );
}
