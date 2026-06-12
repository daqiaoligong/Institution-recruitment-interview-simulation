import type { InterviewMode } from "@humian/shared";
import { Play } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ensureMicrophonePermission } from "../services/recorderService";
import { useAuthStore } from "../stores/authStore";
import { useInterviewStore } from "../stores/interviewStore";
import { useQuestionStore } from "../stores/questionStore";
import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.currentUser)!;
  const { questionSets, selectedSetId, selectSet, freeMockQuestions } = useQuestionStore();
  const startInterview = useInterviewStore((state) => state.startInterview);
  const [mode, setMode] = useState<InterviewMode>("listen");
  const [seconds, setSeconds] = useState(240);
  const [source, setSource] = useState<"set" | "free">(
    searchParams.get("source") === "free" ? "free" : "set"
  );
  const [error, setError] = useState("");
  const [isCheckingMic, setIsCheckingMic] = useState(false);

  function changeSource(nextSource: "set" | "free") {
    setError("");
    if (nextSource === "free" && freeMockQuestions.length === 0) {
      navigate("/question-bank?returnTo=setup");
      return;
    }
    setSource(nextSource);
  }

  async function start() {
    const selectedSet = questionSets.find((item) => item.id === selectedSetId);
    const questions = source === "free" ? freeMockQuestions : selectedSet?.questions ?? [];

    if (!questions.length) {
      if (source === "free") {
        navigate("/question-bank?returnTo=setup");
        return;
      }
      setError("请选择面试套题");
      return;
    }

    setIsCheckingMic(true);
    setError("");

    try {
      await ensureMicrophonePermission();
    } catch (error) {
      setError(error instanceof Error ? error.message : "无法读取麦克风权限，暂时不能开始面试。");
      setIsCheckingMic(false);
      return;
    }

    const session = startInterview({
      userId: user.id,
      mode,
      questions,
      secondsPerQuestion: seconds,
      sourceType: source === "free" ? "free_mock" : "question_set"
    });
    setIsCheckingMic(false);
    navigate(`/interview/session/${session.id}`);
  }

  return (
    <section className="setup-page page-center">
      <motion.div initial="hidden" animate="show" variants={itemVariants}>
        <h1 style={{ margin: 0 }}>开始前设置</h1>
        <p style={{ marginTop: 8 }}>选择套题、答题时间和面试形式</p>
      </motion.div>
      <motion.div 
        className="setup-card"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.label variants={itemVariants}>
          题目来源
          <select value={source} onChange={(event) => changeSource(event.target.value as "set" | "free")}>
            <option value="set">题库套题</option>
            <option value="free">自由组题（{freeMockQuestions.length} 道）</option>
          </select>
        </motion.label>
        {source === "free" && (
          <motion.div className="source-tip" variants={itemVariants}>
            当前将使用自由组题中的 {freeMockQuestions.length} 道题开始模拟。
            <button className="link-button" onClick={() => navigate("/question-bank?returnTo=setup")}>
              继续组题
            </button>
          </motion.div>
        )}
        {source === "set" && (
          <motion.label variants={itemVariants}>
            选择题目
            <select value={selectedSetId} onChange={(event) => selectSet(event.target.value)}>
              {questionSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
          </motion.label>
        )}
        <motion.label variants={itemVariants}>
          每道题面试时间
          <select value={seconds} onChange={(event) => setSeconds(Number(event.target.value))}>
            <option value={180}>3 分钟 / 题</option>
            <option value={240}>4 分钟 / 题</option>
            <option value={300}>5 分钟 / 题</option>
          </select>
        </motion.label>
        <motion.label variants={itemVariants}>
          面试形式
          <select value={mode} onChange={(event) => setMode(event.target.value as InterviewMode)}>
            <option value="listen">听题模式</option>
            <option value="read">看题模式</option>
          </select>
        </motion.label>
        {error && <motion.div className="form-error" variants={itemVariants}>{error}</motion.div>}
        <motion.button 
          className="primary-button" 
          onClick={start} 
          disabled={isCheckingMic}
          variants={itemVariants}
        >
          <Play size={18} />
          {isCheckingMic ? "检查麦克风中" : "开始面试"}
        </motion.button>
      </motion.div>
    </section>
  );
}
