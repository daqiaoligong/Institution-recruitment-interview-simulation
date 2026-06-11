import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function LoginPage() {
  const [username, setUsername] = useState("考生1234");
  const [email, setEmail] = useState("candidate@example.com");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await login(username, email);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "登录失败");
      return;
    }
    navigate("/");
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/assets/logo.png" alt="沪面冲鸭" className="login-logo" />
        <h1>登录沪面冲鸭</h1>
        <p>保存你的面试记录与 AI 复盘</p>
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          邮箱账号
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "登录中" : "登录 / 注册"}
        </button>
      </form>
    </div>
  );
}
