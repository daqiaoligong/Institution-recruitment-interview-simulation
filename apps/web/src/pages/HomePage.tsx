import { Play } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

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
    <motion.section 
      className="home-page page-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item}>上海事业单位面试模拟</motion.h1>
      <motion.p variants={item}>听题、看题、录音与 AI 复盘的一体化练习空间</motion.p>
      <motion.img variants={item} src="/assets/logo.png" alt="沪面冲鸭" className="hero-logo" />
      <motion.button 
        variants={item}
        className="hero-button" 
        onClick={() => navigate(isAuthed ? "/interview/setup" : "/login")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
      >
        <Play size={20} />
        开始面试
      </motion.button>
    </motion.section>
  );
}
