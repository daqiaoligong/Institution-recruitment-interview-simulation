import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function HomePage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);

  return (
    <section className="home-page page-center">
      <h1>上海事业单位面试模拟</h1>
      <p>听题、看题、录音转写与 AI 复盘的一体化练习空间</p>
      <img src="/assets/logo.png" alt="沪面冲鸭" className="hero-logo" />
      <button className="hero-button" onClick={() => navigate(currentUser ? "/interview/setup" : "/login")}>
        <Play size={20} />
        开始面试
      </button>
      <span className="muted">极简流程 · 真实考场 · 本地记录</span>
    </section>
  );
}
