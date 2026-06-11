import { Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateJobQuestions } from "../services/aiService";
import { useAuthStore } from "../stores/authStore";
import { useJobProfileStore } from "../stores/jobProfileStore";
import { useQuestionStore } from "../stores/questionStore";

export function JobProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.currentUser)!;
  const { profile, loadProfile, saveProfile } = useJobProfileStore();
  const {
    questionSets,
    questionTree,
    customQuestions,
    generatedJobQuestions,
    loadQuestionSets,
    loadCustomQuestions,
    selectSet,
    setGeneratedJobQuestions,
    updateGeneratedJobQuestion,
    addCustomQuestion
  } = useQuestionStore();
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? "");
  const [unitName, setUnitName] = useState(profile?.unitName ?? "");
  const [requirements, setRequirements] = useState(profile?.requirements ?? "");
  const [extraInfo, setExtraInfo] = useState(profile?.extraInfo ?? "");
  const [addedIndexes, setAddedIndexes] = useState<number[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    void loadProfile();
    void loadQuestionSets();
    void loadCustomQuestions();
  }, [loadCustomQuestions, loadProfile, loadQuestionSets]);

  useEffect(() => {
    if (!profile) return;
    setJobTitle(profile.jobTitle);
    setUnitName(profile.unitName);
    setRequirements(profile.requirements);
    setExtraInfo(profile.extraInfo);
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await saveProfile({ userId: user.id, jobTitle, unitName, requirements, extraInfo });
    setMessage(result.ok ? "岗位信息已保存" : result.message ?? "岗位信息已本地保存");
  }

  async function generateQuestions() {
    setIsGenerating(true);
    setMessage("");

    try {
      const result = await generateJobQuestions({ userId: user.id, jobTitle, unitName, requirements, extraInfo });
      setGeneratedJobQuestions(result.questions.map((question) => question.content));
      setAddedIndexes([]);
      setMessage("AI 生题已生成，可编辑后加入题库");
    } catch (error) {
      setMessage(error instanceof Error ? `AI 生题失败：${error.message}` : "AI 生题失败");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAddQuestion(content: string, index: number) {
    setAddingIndex(index);
    setMessage("");

    try {
      const result = await addCustomQuestion(content);
      if (!result.ok) {
        setMessage(result.message ?? "加入题库失败");
        return;
      }
      setAddedIndexes((items) => [...items, index]);
      setMessage("已加入我的专属题型");
    } finally {
      setAddingIndex(null);
    }
  }

  function openQuestionSet(id: string) {
    selectSet(id);
    navigate(`/question-bank?set=${encodeURIComponent(id)}`);
  }

  function openCustomQuestions() {
    selectSet("custom");
    navigate("/question-bank?set=custom");
  }

  const tree = questionTree.length
    ? questionTree
    : [{ id: "local", label: "本地题库", children: questionSets.map((set) => ({ id: set.id, label: set.title })) }];

  return (
    <section className="three-column-page">
      <aside className="panel side-panel">
        <h2>题库分类</h2>
        <div className="tree-list">
          {tree.map((node) => (
            <div key={node.id}>
              <strong>{node.label}</strong>
              {node.children?.map((child) => (
                <button className="tree-item" key={child.id} onClick={() => openQuestionSet(child.id)}>
                  {child.label}
                </button>
              ))}
            </div>
          ))}
          <div>
            <strong>我的题库</strong>
            <button className="tree-item" onClick={openCustomQuestions}>
              我的专属题型（{customQuestions.length}）
            </button>
          </div>
        </div>
      </aside>
      <form className="panel main-panel job-form" onSubmit={submit}>
        <h1>岗位信息填报</h1>
        <label>
          岗位名称
          <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
        </label>
        <label>
          岗位所在单位
          <input value={unitName} onChange={(event) => setUnitName(event.target.value)} />
        </label>
        <label>
          岗位要求
          <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} />
        </label>
        <label>
          岗位其他信息
          <textarea value={extraInfo} onChange={(event) => setExtraInfo(event.target.value)} />
        </label>
        {message && <div className="success-message">{message}</div>}
        <button className="secondary-button" type="submit">
          保存
        </button>
      </form>
      <aside className="panel side-panel">
        <h2>AI 生题展示区</h2>
        <div className="generated-list">
          {generatedJobQuestions.map((item, index) => {
            const isAlreadySaved = addedIndexes.includes(index) || customQuestions.some((question) => question.content === item);
            return (
            <div className="generated-item" key={`${item}-${index}`}>
              <textarea
                value={item}
                onChange={(event) => updateGeneratedJobQuestion(index, event.target.value)}
              />
              <button
                className="secondary-button"
                type="button"
                onClick={() => handleAddQuestion(item, index)}
                disabled={addingIndex === index || isAlreadySaved}
              >
                {isAlreadySaved ? "已加入" : addingIndex === index ? "加入中" : "加入题库"}
              </button>
            </div>
          )})}
          {!generatedJobQuestions.length && <p className="muted">点击 AI 生题后展示岗位匹配题。</p>}
        </div>
        <button className="primary-button" type="button" onClick={generateQuestions} disabled={isGenerating}>
          <Sparkles size={16} />
          {isGenerating ? "生成中" : "AI 生题"}
        </button>
      </aside>
    </section>
  );
}
