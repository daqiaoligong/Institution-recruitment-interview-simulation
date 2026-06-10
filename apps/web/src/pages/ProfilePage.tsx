import { Link } from "react-router-dom";
import { useHistoryStore } from "../stores/historyStore";

export function ProfilePage() {
  const sessions = useHistoryStore((state) => state.listSessions());

  return (
    <section className="profile-page">
      <h1>个人中心</h1>
      <p className="muted">你的每一次模拟都会沉淀为可复盘的记录</p>
      <div className="history-list">
        {sessions.map((session) => (
          <Link to={`/interview/review/${session.id}`} className="history-item" key={session.id}>
            <strong>{new Date(session.startedAt).toLocaleString()}</strong>
            <span>{session.mode === "listen" ? "听题模式" : "看题模式"} · {session.questions.length} 道题 · 已生成 AI 分析</span>
            <em>查看</em>
          </Link>
        ))}
        {!sessions.length && (
          <div className="empty-state">
            <h2>暂无模拟练习记录</h2>
            <p>先完成一场模拟面试，记录会出现在这里。</p>
          </div>
        )}
      </div>
    </section>
  );
}
