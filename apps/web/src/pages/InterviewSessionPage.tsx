import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAudioBlob } from "../services/indexedDbService";
import { RecorderService } from "../services/recorderService";
import { speak, stopSpeaking } from "../services/speechService";
import { useHistoryStore } from "../stores/historyStore";
import { useInterviewStore } from "../stores/interviewStore";

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
  const recorderRef = useRef<RecorderService>();
  const captureQuestionIdRef = useRef<string>();
  const [recordingMessage, setRecordingMessage] = useState("准备录音");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blockingError, setBlockingError] = useState("");

  const currentIndex = current?.answers.length ?? 0;
  const currentQuestion = current?.questions[currentIndex];

  const isDone = useMemo(() => {
    if (!current) return false;
    return current.answers.length >= current.questions.length || current.remainingSeconds <= 0;
  }, [current]);

  const startCapture = useCallback(async () => {
    if (!current || !currentQuestion || captureQuestionIdRef.current === currentQuestion.id) return;

    captureQuestionIdRef.current = currentQuestion.id;
    setRecordingMessage("正在启动录音");
    setBlockingError("");

    const recorder = new RecorderService();
    recorderRef.current = recorder;

    try {
      await recorder.start();
      setIsRecording(true);
      setRecordingMessage("录音中");
    } catch (error) {
      setIsRecording(false);
      setStatus("paused");
      setBlockingError(error instanceof Error ? error.message : "无法读取麦克风权限，暂时不能开始面试。");
      setRecordingMessage("录音不可用");
    }
  }, [current, currentQuestion, setStatus]);

  const stopCapture = useCallback(async () => {
    const recorder = recorderRef.current;
    recorderRef.current = undefined;
    captureQuestionIdRef.current = undefined;
    setIsRecording(false);

    if (!current || !currentQuestion || !recorder) {
      return { transcript: "" };
    }

    const audio = await recorder.stop();
    if (!audio.blob || audio.blob.size === 0) {
      setRecordingMessage("未生成有效录音");
      return {
        transcript: "",
        durationSeconds: audio.durationSeconds,
        audioMimeType: audio.mimeType,
        audioSizeBytes: audio.sizeBytes
      };
    }

    const audioBlobId = `${current.id}-${currentQuestion.id}-${Date.now()}`;
    await saveAudioBlob(audioBlobId, audio.blob);
    setRecordingMessage("录音已保存");

    return {
      transcript: "",
      durationSeconds: audio.durationSeconds,
      audioBlobId,
      audioMimeType: audio.mimeType,
      audioSizeBytes: audio.sizeBytes
    };
  }, [current, currentQuestion]);

  const saveAndNext = useCallback(async () => {
    if (isSaving || blockingError) return;
    setIsSaving(true);
    const answer = await stopCapture();
    saveCurrentAnswer(answer);
    nextQuestion();
    setIsSaving(false);
  }, [blockingError, isSaving, nextQuestion, saveCurrentAnswer, stopCapture]);

  const handleFinish = useCallback(async () => {
    if (!current || isSaving || blockingError) return;
    setIsSaving(true);

    if (current.answers.length < current.questions.length && currentQuestion) {
      const answer = await stopCapture();
      saveCurrentAnswer(answer);
    }

    const finished = finishInterview();
    if (finished) {
      saveSession(finished);
      navigate(`/interview/processing/${finished.id}`);
    }
    setIsSaving(false);
  }, [blockingError, current, currentQuestion, finishInterview, isSaving, navigate, saveCurrentAnswer, saveSession, stopCapture]);

  useEffect(() => {
    if (!current || current.status === "finished" || current.status === "paused" || blockingError) return;
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [blockingError, current?.id, current?.status, tick]);

  useEffect(() => {
    if (!current || current.mode !== "listen" || !currentQuestion || current.status !== "reading") return;
    speak(`考生请听题。${currentQuestion.content}`, () => setStatus("answering"));
    return () => stopSpeaking();
  }, [current?.id, currentQuestion?.id, current?.status, current?.mode, setStatus]);

  useEffect(() => {
    if (current?.status === "answering" && currentQuestion) {
      void startCapture();
    }
  }, [current?.status, currentQuestion?.id, startCapture]);

  useEffect(() => {
    setRecordingMessage("准备录音");
    setBlockingError("");
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!current || !isDone || current.status === "finished") return;
    void handleFinish();
  }, [current, handleFinish, isDone]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isRecording) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      void recorderRef.current?.stop();
    };
  }, []);

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

  function handlePauseToggle() {
    if (blockingError) return;

    if (current?.status === "paused") {
      recorderRef.current?.resume();
      setIsRecording(recorderRef.current?.getState() === "recording");
      setStatus("answering");
      setRecordingMessage(recorderRef.current ? "录音中" : recordingMessage);
      return;
    }

    recorderRef.current?.pause();
    setIsRecording(false);
    setStatus("paused");
    setRecordingMessage(recorderRef.current ? "录音已暂停" : recordingMessage);
  }

  function handleReset() {
    if (window.confirm("确认重新开始本场面试吗？当前临时作答会被清空。")) {
      void recorderRef.current?.stop();
      resetInterview();
      setIsRecording(false);
      setBlockingError("");
      captureQuestionIdRef.current = undefined;
    }
  }

  const modeLabel = current.mode === "listen" ? "听题模式" : "看题模式";
  const readExpanded = current.mode === "read" && isQuestionVisible;
  const recordingLabel = current.status === "paused" && !blockingError ? "已暂停" : recordingMessage;

  return (
    <section className={readExpanded ? "interview-page read-expanded" : "interview-page immersive"}>
      <div className="interview-mode">{modeLabel}</div>
      <div className="countdown-pill">
        <span>倒计时</span>
        <strong>{formatTime(current.remainingSeconds)}</strong>
      </div>

      {blockingError && (
        <div className="mic-blocking-panel">
          <h2>无法开始录音</h2>
          <p>{blockingError}</p>
          <button className="secondary-button" onClick={() => navigate("/interview/setup")}>
            返回重新授权
          </button>
        </div>
      )}

      {readExpanded && !blockingError && (
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

      {!readExpanded && current.mode === "read" && !blockingError && (
        <button className="show-question-button" onClick={toggleQuestionVisible}>
          <ChevronUp size={16} />
          显示题目
        </button>
      )}

      <div className="interview-controls">
        <div className={isRecording ? "record-dot active" : "record-dot"}>●</div>
        <button className="round-control" onClick={handlePauseToggle} disabled={isSaving || Boolean(blockingError)}>
          {current.status === "paused" ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button
          className="next-control"
          onClick={currentIndex >= current.questions.length - 1 ? handleFinish : saveAndNext}
          disabled={isSaving || Boolean(blockingError)}
        >
          {isSaving ? "保存中" : currentIndex >= current.questions.length - 1 ? "完成" : "下一题"}
        </button>
        <button className="round-control" onClick={handleReset} disabled={isSaving}>
          <RotateCcw size={20} />
        </button>
      </div>
      <div className="recording-label">{recordingLabel}</div>
    </section>
  );
}
