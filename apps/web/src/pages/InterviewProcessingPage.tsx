import type { InterviewAnswer } from "@humian/shared";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateInterviewReport, reviewAnswer, transcribeAudio } from "../services/aiService";
import { getAudioBlob } from "../services/indexedDbService";
import { uploadAudioBlob } from "../services/uploadService";
import { useHistoryStore } from "../stores/historyStore";
import { useJobProfileStore } from "../stores/jobProfileStore";

type StepStatus = "waiting" | "active" | "done" | "warning";

interface ProcessingStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

function createInitialSteps(answers: InterviewAnswer[]): ProcessingStep[] {
  return [
    ...answers.flatMap((answer) => [
      {
        id: `${answer.id}-transcribe`,
        label: `第 ${answer.sortOrder} 题录音转文字`,
        status: "waiting" as const
      },
      {
        id: `${answer.id}-review`,
        label: `第 ${answer.sortOrder} 题 AI 点评`,
        status: "waiting" as const
      }
    ]),
    { id: "report", label: "生成整场复盘报告", status: "waiting" as const }
  ];
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function InterviewProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useHistoryStore((state) => state.getSession(id ?? ""));
  const updateAnswerTranscription = useHistoryStore((state) => state.updateAnswerTranscription);
  const updateAnswerReview = useHistoryStore((state) => state.updateAnswerReview);
  const updateReport = useHistoryStore((state) => state.updateReport);
  const profile = useJobProfileStore((state) => state.profile);
  const [steps, setSteps] = useState<ProcessingStep[]>(() => createInitialSteps(session?.answers ?? []));
  const [summary, setSummary] = useState("正在整理录音、文字和 AI 复盘");
  const startedRef = useRef(false);

  function updateStep(id: string, status: StepStatus, detail?: string) {
    setSteps((items) => items.map((item) => (item.id === id ? { ...item, status, detail } : item)));
  }

  useEffect(() => {
    if (!session || startedRef.current) return;
    startedRef.current = true;
    setSteps(createInitialSteps(session.answers));

    async function processSession() {
      if (!session) return;

      for (const answer of session.answers) {
        const transcriptStepId = `${answer.id}-transcribe`;
        const reviewStepId = `${answer.id}-review`;
        let transcript = answer.transcript;

        updateStep(transcriptStepId, "active");
        try {
          if (answer.audioBlobId) {
            const blob = await getAudioBlob(answer.audioBlobId);
            if (blob) {
              const audioData = await blobToDataUrl(blob);
              let upload:
                | {
                    fileUrl: string;
                    mimeType: string;
                    durationSeconds?: number;
                  }
                | undefined;
              try {
                upload = await uploadAudioBlob({
                  blob,
                  fileName: `${answer.id}.webm`,
                  mimeType: answer.audioMimeType,
                  durationSeconds: answer.durationSeconds
                });
              } catch {
                upload = undefined;
              }
              const transcription = await transcribeAudio({
                fileUrl: upload?.fileUrl,
                audioData,
                mimeType: upload?.mimeType ?? blob.type ?? answer.audioMimeType,
                durationSeconds: upload?.durationSeconds ?? answer.durationSeconds
              });
              transcript = transcription.transcript;
              updateAnswerTranscription(session.id, answer.id, {
                transcript,
                status: transcription.status,
                message: transcription.message
              });
              updateStep(
                transcriptStepId,
                transcription.status === "completed" ? "done" : "warning",
                transcription.message
              );
            } else {
              updateAnswerTranscription(session.id, answer.id, {
                transcript,
                status: "failed",
                message: "未找到本地录音文件。"
              });
              updateStep(transcriptStepId, "warning", "未找到本地录音文件。");
            }
          } else {
            updateAnswerTranscription(session.id, answer.id, {
              transcript,
              status: "unavailable",
              message: "本题没有录音。"
            });
            updateStep(transcriptStepId, "warning", "本题没有录音。");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "转写失败。";
          updateAnswerTranscription(session.id, answer.id, {
            transcript,
            status: "failed",
            message
          });
          updateStep(transcriptStepId, "warning", message);
        }

        updateStep(reviewStepId, "active");
        try {
          const review = await reviewAnswer({
            question: answer.questionContentSnapshot,
            transcript,
            jobProfile: profile
          });
          updateAnswerReview(session.id, answer.id, review);
          updateStep(reviewStepId, "done");
        } catch (error) {
          updateStep(reviewStepId, "warning", error instanceof Error ? error.message : "AI 点评生成失败。");
        }
      }

      updateStep("report", "active");
      try {
        const latest = useHistoryStore.getState().getSession(session.id) ?? session;
        const report = await generateInterviewReport({
          answers: latest.answers.map((answer) => ({
            question: answer.questionContentSnapshot,
            transcript: answer.transcript,
            aiReview: answer.aiReview
          })),
          jobProfile: profile
        });
        updateReport(session.id, report);
        updateStep("report", "done");
        setSummary("复盘已生成，正在打开结果");
      } catch (error) {
        updateStep("report", "warning", error instanceof Error ? error.message : "整场报告生成失败。");
        setSummary("基础复盘已整理完成，整场报告稍后可重试");
      }

      window.setTimeout(() => navigate(`/interview/review/${session.id}`, { replace: true }), 900);
    }

    void processSession();
  }, [navigate, profile, session, updateAnswerReview, updateAnswerTranscription, updateReport]);

  if (!session) {
    return (
      <section className="page-center">
        <h1>未找到面试记录</h1>
        <p>请先完成一场模拟面试。</p>
      </section>
    );
  }

  const doneCount = steps.filter((step) => step.status === "done" || step.status === "warning").length;
  const progress = Math.round((doneCount / Math.max(steps.length, 1)) * 100);

  return (
    <section className="processing-page">
      <div className="processing-panel">
        <div className="processing-spinner">
          <Loader2 size={42} />
        </div>
        <h1>正在生成面试复盘</h1>
        <p>{summary}</p>
        <div className="processing-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <strong>{progress}%</strong>
        <div className="processing-steps">
          {steps.map((step) => (
            <div className={`processing-step ${step.status}`} key={step.id}>
              {step.status === "done" ? (
                <CheckCircle2 size={18} />
              ) : step.status === "warning" ? (
                <AlertCircle size={18} />
              ) : (
                <Loader2 size={18} />
              )}
              <span>{step.label}</span>
              {step.detail ? <em>{step.detail}</em> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
