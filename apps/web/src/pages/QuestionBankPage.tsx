import { Plus, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { questionTree } from "../data/questionTree";
import { useQuestionStore } from "../stores/questionStore";

export function QuestionBankPage() {
  const [searchParams] = useSearchParams();
  const {
    questionSets,
    selectedSetId,
    selectSet,
    addToFreeMock,
    freeMockQuestions,
    removeFromFreeMock,
    updateFreeMockQuestion
  } = useQuestionStore();
  const selectedSet = questionSets.find((set) => set.id === selectedSetId) ?? questionSets[0];
  const isReturningToSetup = searchParams.get("returnTo") === "setup";

  return (
    <section className="three-column-page">
      <aside className="panel side-panel">
        <h2>题库分类</h2>
        <div className="tree-list">
          {questionTree.map((node) => (
            <div key={node.id}>
              <strong>{node.label}</strong>
              {node.children?.map((child) => (
                <button key={child.id} className="tree-item">
                  {child.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <section className="panel main-panel">
        <div className="panel-header">
          <h1>{selectedSet.title}</h1>
          <select value={selectedSetId} onChange={(event) => selectSet(event.target.value)}>
            {questionSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title}
              </option>
            ))}
          </select>
        </div>
        <div className="question-list">
          {selectedSet.questions.map((question, index) => (
            <article className="question-card" key={question.id}>
              <span className="question-number">{index + 1}</span>
              <p>{question.content}</p>
              <button className="secondary-button" onClick={() => addToFreeMock(question)}>
                <Plus size={16} />
                加入模拟
              </button>
            </article>
          ))}
        </div>
      </section>
      <aside className="panel side-panel">
        <h2>自由组题</h2>
        <div className="free-list">
          {freeMockQuestions.map((question, index) => (
            <div className="free-item" key={question.id}>
              <span>第 {index + 1} 题</span>
              <textarea value={question.content} onChange={(event) => updateFreeMockQuestion(question.id, event.target.value)} />
              <button className="icon-button" onClick={() => removeFromFreeMock(question.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!freeMockQuestions.length && (
            <p className="muted">
              {isReturningToSetup ? "请先从中间题目加入自由模拟，组好题后再回到面试配置。" : "从中间题目加入自由模拟。"}
            </p>
          )}
        </div>
        <Link className="primary-button block-link" to="/interview/setup?source=free">
          {freeMockQuestions.length ? "用自由组题开始模拟" : "组题后开始模拟"}
        </Link>
      </aside>
    </section>
  );
}
