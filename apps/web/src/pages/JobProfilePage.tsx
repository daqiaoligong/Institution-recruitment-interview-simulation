import { Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useJobProfileStore } from "../stores/jobProfileStore";
import { useQuestionStore } from "../stores/questionStore";

export function JobProfilePage() {
  const user = useAuthStore((state) => state.currentUser)!;
  const { profile, saveProfile } = useJobProfileStore();
  const addCustomQuestion = useQuestionStore((state) => state.addCustomQuestion);
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? "");
  const [unitName, setUnitName] = useState(profile?.unitName ?? "");
  const [requirements, setRequirements] = useState(profile?.requirements ?? "");
  const [extraInfo, setExtraInfo] = useState(profile?.extraInfo ?? "");
  const [generated, setGenerated] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    saveProfile({ userId: user.id, jobTitle, unitName, requirements, extraInfo });
    setMessage("岗位信息已保存");
  }

  function generateQuestions() {
    const base = jobTitle || "报考岗位";
    setGenerated([
      `请结合你的经历，谈谈你为什么适合${base}？`,
      `${base}工作中需要跨部门沟通时，你会如何推进？`,
      `如果群众对${unitName || "单位"}服务流程不满意，你会如何调研并改进？`,
      `请谈谈你对${base}岗位服务意识和执行力的理解。`
    ]);
  }

  return (
    <section className="three-column-page">
      <aside className="panel side-panel">
        <h2>题库分类</h2>
        <button className="tree-item active">上海区属事业单位</button>
        <button className="tree-item">综合分析</button>
        <button className="tree-item">岗位匹配题</button>
        <button className="tree-item">我的专属题型</button>
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
          {generated.map((item, index) => (
            <div className="generated-item" key={item}>
              <textarea value={item} onChange={(event) => {
                const next = [...generated];
                next[index] = event.target.value;
                setGenerated(next);
              }} />
              <button className="secondary-button" onClick={() => addCustomQuestion(item)}>
                加入题库
              </button>
            </div>
          ))}
          {!generated.length && <p className="muted">点击 AI 生题后展示岗位匹配题。</p>}
        </div>
        <button className="primary-button" onClick={generateQuestions}>
          <Sparkles size={16} />
          AI 生题
        </button>
      </aside>
    </section>
  );
}
