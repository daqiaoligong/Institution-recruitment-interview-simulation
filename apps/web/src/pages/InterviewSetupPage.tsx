import { Play } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { InterviewMode } from "@humian/shared";
import { useAuthStore } from "../stores/authStore";
import { useInterviewStore } from "../stores/interviewStore";
import { useQuestionStore } from "../stores/questionStore";

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

  function changeSource(nextSource: "set" | "free") {
    setError("");
    if (nextSource === "free" && freeMockQuestions.length === 0) {
      navigate("/question-bank?returnTo=setup");
      return;
    }
    setSource(nextSource);
  }

  function start() {
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
    const session = startInterview({
      userId: user.id,
      mode,
      questions,
      secondsPerQuestion: seconds,
      sourceType: source === "free" ? "free_mock" : "question_set"
    });
    navigate(`/interview/session/${session.id}`);
  }

  return (
    <section className="setup-page page-center">
      <h1>开始前设置</h1>
      <p>选择套题、答题时间和面试形式</p>
      <div className="setup-card">
        <label>
          题目来源
          <select value={source} onChange={(event) => changeSource(event.target.value as "set" | "free")}>
            <option value="set">题库套题</option>
            <option value="free">自由组题（{freeMockQuestions.length} 道）</option>
          </select>
        </label>
        {source === "free" && (
          <div className="source-tip">
            当前将使用自由组题中的 {freeMockQuestions.length} 道题开始模拟。
            <button className="link-button" onClick={() => navigate("/question-bank?returnTo=setup")}>
              继续组题
            </button>
          </div>
        )}
        {source === "set" && (
          <label>
            选择题目
            <select value={selectedSetId} onChange={(event) => selectSet(event.target.value)}>
              {questionSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          每道题面试时间
          <select value={seconds} onChange={(event) => setSeconds(Number(event.target.value))}>
            <option value={180}>3 分钟 / 题</option>
            <option value={240}>4 分钟 / 题</option>
            <option value={300}>5 分钟 / 题</option>
          </select>
        </label>
        <label>
          面试形式
          <select value={mode} onChange={(event) => setMode(event.target.value as InterviewMode)}>
            <option value="listen">听题模式</option>
            <option value="read">看题模式</option>
          </select>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" onClick={start}>
          <Play size={18} />
          开始面试
        </button>
      </div>
    </section>
  );
}
