import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistoryStore } from "../stores/historyStore";
import { useInterviewStore } from "../stores/interviewStore";
import { speak, stopSpeaking } from "../services/speechService";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function InterviewSessionPage() {
  const navigate = useNavigate();
  const {
    current,
    isQuestionVisible,
    tick,
    setStatus,
    toggleQuestionVisible,
    saveCurrentAnswer,
    nextQuestion,
    finishInterview,
    resetInterview
  } = useInterviewStore();
  const saveSession = useHistoryStore((state) => state.saveSession);
  const [draft, setDraft] = useState("");

  const currentIndex = current?.answers.length ?? 0;
  const currentQuestion = current?.questions[currentIndex];

  const isDone = useMemo(() => {
    if (!current) return false;
    return current.answers.length >= current.questions.length || current.remainingSeconds <= 0;
  }, [current]);

  useEffect(() => {
    if (!current || current.status === "finished") return;
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [current?.id, current?.status, tick]);

  useEffect(() => {
    if (!current || current.mode !== "listen" || !currentQuestion || current.status !== "reading") return;
    speak(`考生请听题。${currentQuestion.content}`, () => setStatus("answering"));
    return () => stopSpeaking();
  }, [current?.id, currentQuestion?.id, current?.status, current?.mode, setStatus]);

  useEffect(() => {
    if (!current || !isDone || current.status === "finished") return;
    handleFinish();
  }, [isDone]);

  if (!current || !currentQuestion) {
    return (
      <section className="page-center">
        <h1>暂无进行中的面试</h1>
        <button className="primary-button" onClick={() => navigate("/interview/setup")}>
          返回配置
        </button>
      </section>
    );
  }

  function saveAndNext() {
    saveCurrentAnswer(draft);
    setDraft("");
    nextQuestion();
  }

  function handleFinish() {
    if (!current) return;
    if (current.answers.length < current.questions.length && currentQuestion) {
      saveCurrentAnswer(draft);
    }
    const finished = finishInterview();
    if (finished) {
      saveSession(finished);
      navigate(`/interview/review/${finished.id}`);
    }
  }

  function handleReset() {
    if (window.confirm("确认重新开始本场面试吗？当前临时作答会被清空。")) {
      resetInterview();
      setDraft("");
    }
  }

  const modeLabel = current.mode === "listen" ? "听题模式" : "看题模式";
  const readExpanded = current.mode === "read" && isQuestionVisible;

  return (
    <section className={readExpanded ? "interview-page read-expanded" : "interview-page immersive"}>
      <div className="interview-mode">{modeLabel}</div>
      <div className="countdown-pill">
        <span>倒计时</span>
        <strong>{formatTime(current.remainingSeconds)}</strong>
      </div>

      {readExpanded && (
        <div className="reading-layer">
          <button className="collapse-trigger" onClick={toggleQuestionVisible} title="收起题目">
            <ChevronDown size={32} />
          </button>
          {current.questions.map((question, index) => (
            <article className="reading-question" key={question.id}>
              <span>{index + 1}</span>
              <p>{question.content}</p>
            </article>
          ))}
        </div>
      )}

      {!readExpanded && current.mode === "read" && (
        <button className="show-question-button" onClick={toggleQuestionVisible}>
          <ChevronUp size={16} />
          显示题目
        </button>
      )}

      {current.mode === "listen" && (
        <textarea
          className="hidden-draft-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="MVP 阶段可在此输入转写文本，后续接入真实录音和转写。"
        />
      )}

      {current.mode === "read" && (
        <textarea
          className="read-draft-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="MVP 阶段可在此输入本题转写文本。"
        />
      )}

      <div className="interview-controls">
        <div className="record-dot">●</div>
        <button className="round-control" onClick={() => setStatus(current.status === "paused" ? "answering" : "paused")}>
          {current.status === "paused" ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button className="next-control" onClick={currentIndex >= current.questions.length - 1 ? handleFinish : saveAndNext}>
          下一题
        </button>
        <button className="round-control" onClick={handleReset}>
          <RotateCcw size={20} />
        </button>
      </div>
      <div className="recording-label">录音中</div>
    </section>
  );
}
