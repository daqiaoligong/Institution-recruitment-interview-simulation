import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export function TopNav() {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="top-nav">
      <Link to="/" className="brand">
        <img src="/assets/logo.png" alt="logo" className="brand-logo" />
        <img src="/assets/name.png" alt="沪面冲鸭" className="brand-name" />
      </Link>
      <nav className="nav-links">
        <NavLink to="/interview/setup">面试模拟</NavLink>
        <NavLink to="/question-bank">题库</NavLink>
        <NavLink to="/job-profile">岗位信息</NavLink>
      </nav>
      <button
        className="avatar-button"
        onClick={() => (currentUser ? navigate("/profile") : navigate("/login"))}
        title={currentUser?.username ?? "登录"}
      >
        {currentUser ? currentUser.username.slice(0, 1) : "我"}
      </button>
      {currentUser && (
        <button className="link-button" onClick={logout}>
          退出
        </button>
      )}
    </header>
  );
}
