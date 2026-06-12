import type { InterviewAnswer } from "@humian/shared";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { generateInterviewReport, reviewAnswer } from "../services/aiService";
import { getAudioBlob } from "../services/indexedDbService";
import { useHistoryStore } from "../stores/historyStore";
import { useJobProfileStore } from "../stores/jobProfileStore";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

function AnswerDetailView({
  answer,
  sessionId,
  onTranscriptChange,
  onReview
}: {
  answer: InterviewAnswer;
  sessionId: string;
  onTranscriptChange: (sessionId: string, answerId: string, transcript: string) => void;
  onReview: (answer: InterviewAnswer, transcript: string) => Promise<void>;
}) {
  const [audioUrl, setAudioUrl] = useState<string>();
  const [audioMessage, setAudioMessage] = useState(answer.audioBlobId ? "正在读取录音" : "本题暂无录音");
  const [transcript, setTranscript] = useState(answer.transcript);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    setTranscript(answer.transcript);
  }, [answer.transcript]);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    async function loadAudio() {
      if (!answer.audioBlobId) {
        setAudioUrl(undefined);
        setAudioMessage("本题暂无录音");
        return;
      }

      const blob = await getAudioBlob(answer.audioBlobId);
      if (cancelled) return;

      if (!blob) {
        setAudioUrl(undefined);
        setAudioMessage("未找到本地录音文件");
        return;
      }

      objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
      setAudioMessage("录音已加载");
    }

    void loadAudio();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [answer.audioBlobId]);

  async function handleReview() {
    setIsReviewing(true);
    try {
      onTranscriptChange(sessionId, answer.id, transcript);
      await onReview(answer, transcript);
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="answer-detail-wrapper"
      style={{ display: 'grid', gap: '28px' }}
    >
      <div>
        <div className="review-answer-heading" style={{ marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>第 {answer.sortOrder} 题</h2>
          <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            耗时：{answer.durationSeconds ? `${answer.durationSeconds} 秒` : "未记录时长"}
          </span>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
          {answer.questionContentSnapshot}
        </p>
      </div>

      <div className="audio-player-block">
        {audioUrl ? <audio controls src={audioUrl} /> : <span>{audioMessage}</span>}
        {answer.audioSizeBytes ? <em>{Math.round(answer.audioSizeBytes / 1024)} KB</em> : null}
      </div>

      <label className="transcript-editor">
        转写文本
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          onBlur={() => onTranscriptChange(sessionId, answer.id, transcript)}
          placeholder="未识别到有效作答，可在这里手动补充"
        />
      </label>
      {answer.transcriptStatus && answer.transcriptStatus !== "completed" ? (
        <div className="transcript-note">{answer.transcriptMessage ?? "转写暂不可用，可手动补充文本后生成点评。"}</div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button className="primary-button" onClick={handleReview} disabled={isReviewing}>
          <Sparkles size={16} />
          {isReviewing ? "点评生成中..." : "生成单题点评"}
        </button>
      </div>

      {(answer.aiReview?.comment || answer.aiReview?.thinking) && (
        <div style={{ display: 'grid', gap: '20px', marginTop: '10px', paddingTop: '30px', borderTop: '1px solid var(--line)' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand)', margin: '0 0 12px' }}>
              <CheckCircle2 size={20} /> AI 综合评语
            </h3>
            <p style={{ lineHeight: 1.7, margin: 0 }}>{answer.aiReview.comment}</p>
            {answer.aiReview.suggestions && answer.aiReview.suggestions.length > 0 && (
              <ul style={{ paddingLeft: '20px', lineHeight: 1.7, color: 'var(--muted)', marginTop: '12px' }}>
                {answer.aiReview.suggestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </div>

          <div style={{ marginTop: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)', margin: '0 0 12px' }}>
              <FileText size={20} /> 标准答题思路
            </h3>
            <p style={{ lineHeight: 1.7, color: 'var(--muted)', margin: 0 }}>{answer.aiReview.thinking}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function InterviewReviewPage() {
  const { id } = useParams();
  const session = useHistoryStore((state) => state.getSession(id ?? ""));
  const updateAnswerTranscript = useHistoryStore((state) => state.updateAnswerTranscript);
  const updateAnswerReview = useHistoryStore((state) => state.updateAnswerReview);
  const updateReport = useHistoryStore((state) => state.updateReport);
  const profile = useJobProfileStore((state) => state.profile);
  
  const [selectedId, setSelectedId] = useState<string>("report");
  const [isReporting, setIsReporting] = useState(false);
  const [message, setMessage] = useState("");

  if (!session) {
    return (
      <section className="page-center">
        <h1>未找到面试记录</h1>
        <p>请先完成一场模拟面试。</p>
      </section>
    );
  }

  const activeSession = session;
  const selectedAnswer = activeSession.answers.find((a) => a.id === selectedId);

  async function handleReview(answer: InterviewAnswer, transcript: string) {
    const review = await reviewAnswer({
      question: answer.questionContentSnapshot,
      transcript,
      questionType: undefined,
      jobProfile: profile
    });
    updateAnswerReview(activeSession.id, answer.id, review);
    setMessage("单题点评已更新");
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleReport() {
    setIsReporting(true);
    setMessage("");
    try {
      const report = await generateInterviewReport({
        answers: activeSession.answers.map((answer) => ({
          question: answer.questionContentSnapshot,
          transcript: answer.transcript,
          aiReview: answer.aiReview
        })),
        jobProfile: profile
      });
      updateReport(activeSession.id, report);
      setMessage("整场总评报告已生成");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? `生成失败：${error.message}` : "生成失败");
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0 }}>面试结束复盘</h1>
          <p className="muted" style={{ margin: '6px 0 0' }}>在左侧大纲选择题目或查看整场报告</p>
        </div>
        {message && <div className="success-message" style={{ margin: 0, padding: '8px 16px' }}>{message}</div>}
      </div>

      <section className="review-page">
        {/* Master List (Left Sidebar) */}
        <motion.div 
          className="master-list"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <motion.button 
            variants={itemVariants}
            className={`master-item ${selectedId === "report" ? "active" : ""}`}
            onClick={() => setSelectedId("report")}
          >
            <div className="master-item-header">
              <span>整场报告总览</span>
            </div>
            <p>{activeSession.report?.summary ? "已生成总评报告" : "点击生成整场表现评估"}</p>
          </motion.button>

          <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

          {activeSession.answers.map((answer) => (
            <motion.button
              key={answer.id}
              variants={itemVariants}
              className={`master-item ${selectedId === answer.id ? "active" : ""}`}
              onClick={() => setSelectedId(answer.id)}
            >
              <div className="master-item-header">
                <span>第 {answer.sortOrder} 题</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                  {answer.durationSeconds ? `${answer.durationSeconds}s` : "-"}
                </span>
              </div>
              <p>{answer.questionContentSnapshot}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Detail Inspector (Right View) */}
        <div className="detail-inspector">
          <AnimatePresence mode="wait">
            {selectedId === "report" ? (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'grid', gap: '30px' }}
              >
                <div>
                  <h2 style={{ margin: '0 0 16px', fontSize: '28px' }}>整场面试评估报告</h2>
                  <div className="score-row" style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ padding: '10px 20px', background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: '12px', fontWeight: 800, fontSize: '16px' }}>
                      总分：{activeSession.report?.totalScore ?? "-"}
                    </div>
                    <div style={{ padding: '10px 20px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                      岗位匹配：{activeSession.report?.matchScore ?? "-"}
                    </div>
                    <div style={{ padding: '10px 20px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                      稳定度：{activeSession.report?.stabilityScore ?? "-"}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                  <h3 style={{ margin: '0 0 12px' }}>综合评语</h3>
                  <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--ink)' }}>
                    {activeSession.report?.summary ?? "尚未生成整场报告。系统将综合您的所有单题表现、用词习惯、停顿和逻辑，给出最终评估。"}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button className="hero-button" onClick={handleReport} disabled={isReporting} style={{ height: '52px', minWidth: '200px' }}>
                    <Sparkles size={18} />
                    {isReporting ? "AI 报告生成中..." : activeSession.report ? "重新生成报告" : "立即生成整场报告"}
                  </button>
                </div>
              </motion.div>
            ) : selectedAnswer ? (
              <AnswerDetailView
                key={selectedAnswer.id}
                answer={selectedAnswer}
                sessionId={activeSession.id}
                onTranscriptChange={updateAnswerTranscript}
                onReview={handleReview}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
