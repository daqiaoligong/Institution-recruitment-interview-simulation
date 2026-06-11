import { Play } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function HomePage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const isAuthed = Boolean(currentUser && token);

  useEffect(() => {
    document.body.classList.add("home-scroll-lock");
    return () => document.body.classList.remove("home-scroll-lock");
  }, []);

  return (
    <section className="home-page page-center">
      <h1>上海事业单位面试模拟</h1>
      <p>听题、看题、录音与 AI 复盘的一体化练习空间</p>
      <img src="/assets/logo.png" alt="沪面冲鸭" className="hero-logo" />
      <button className="hero-button" onClick={() => navigate(isAuthed ? "/interview/setup" : "/login")}>
        <Play size={20} />
        开始面试
      </button>
    </section>
  );
}
