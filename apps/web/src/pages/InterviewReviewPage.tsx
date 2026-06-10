import { useParams } from "react-router-dom";
import { useHistoryStore } from "../stores/historyStore";

export function InterviewReviewPage() {
  const { id } = useParams();
  const session = useHistoryStore((state) => state.getSession(id ?? ""));
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
        <p className="muted">逐题查看题目、转写文本、AI 评语与答题思路</p>
        <div className="review-answer-list">
          {session.answers.map((answer) => (
            <article className="review-answer-card" key={answer.id}>
              <h3>第 {answer.sortOrder} 题</h3>
              <p>{answer.questionContentSnapshot}</p>
              <div className="audio-placeholder">录音占位 · Phase 3 接入真实播放</div>
              <p className="transcript">转写：{answer.transcript || "未识别到有效作答"}</p>
            </article>
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
