import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuestionStore } from "../stores/questionStore";
import { motion, type Variants } from "framer-motion";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export function QuestionBankPage() {
  const [searchParams] = useSearchParams();
  const {
    questionSets,
    questionTree,
    selectedSetId,
    selectSet,
    addToFreeMock,
    freeMockQuestions,
    removeFromFreeMock,
    updateFreeMockQuestion,
    loadQuestionSets,
    loadCustomQuestions,
    customQuestions,
    addCustomQuestion,
    deleteCustomQuestion
  } = useQuestionStore();
  const selectedSet = questionSets.find((set) => set.id === selectedSetId) ?? questionSets[0];
  const isCustomSelected = selectedSetId === "custom";
  const isReturningToSetup = searchParams.get("returnTo") === "setup";
  const targetSetId = searchParams.get("set");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomContent, setNewCustomContent] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [busyCustomId, setBusyCustomId] = useState<string>();

  useEffect(() => {
    void loadQuestionSets();
    void loadCustomQuestions();
  }, [loadCustomQuestions, loadQuestionSets]);

  useEffect(() => {
    if (targetSetId) {
      selectSet(targetSetId);
    }
  }, [selectSet, targetSetId]);

  async function handleCreateCustomQuestion() {
    const content = newCustomContent.trim();
    if (!content) {
      setCustomMessage("请先输入题目内容");
      return;
    }

    setBusyCustomId("new");
    setCustomMessage("");
    try {
      const result = await addCustomQuestion(content);
      if (!result.ok) {
        setCustomMessage(result.message ?? "新增题目失败");
        return;
      }
      setNewCustomContent("");
      setIsAddingCustom(false);
      setCustomMessage("题目已加入我的专属题型");
    } finally {
      setBusyCustomId(undefined);
    }
  }

  async function handleDeleteCustomQuestion(id: string) {
    if (!window.confirm("确认删除这道专属题吗？")) return;

    setBusyCustomId(id);
    setCustomMessage("");
    try {
      const result = await deleteCustomQuestion(id);
      setCustomMessage(result.ok ? "题目已删除" : result.message ?? "删除题目失败");
    } finally {
      setBusyCustomId(undefined);
    }
  }

  return (
    <section className="three-column-page">
      <aside className="panel side-panel">
        <h2>题库分类</h2>
        <div className="tree-list">
          {(questionTree.length ? questionTree : [{ id: "local", label: "本地题库", children: questionSets.map((set) => ({ id: set.id, label: set.title })) }]).map((node) => (
            <div key={node.id}>
              <strong>{node.label}</strong>
              {node.children?.map((child) => (
                <button key={child.id} className="tree-item" onClick={() => selectSet(child.id)}>
                  {child.label}
                </button>
              ))}
            </div>
          ))}
          <div>
            <strong>我的题库</strong>
            <button className="tree-item" onClick={() => selectSet("custom")}>
              我的专属题型
            </button>
          </div>
        </div>
      </aside>
      <section className="panel main-panel">
        <div className="panel-header">
          <h1>{isCustomSelected ? "我的专属题型" : selectedSet.title}</h1>
          <div className="panel-actions">
            {isCustomSelected && (
              <button className="secondary-button" type="button" onClick={() => setIsAddingCustom(true)}>
                <Plus size={16} />
                新增题目
              </button>
            )}
            <select value={selectedSetId} onChange={(event) => selectSet(event.target.value)}>
              {questionSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
              <option value="custom">我的专属题型</option>
            </select>
          </div>
        </div>
        {isCustomSelected && customMessage && <div className="success-message">{customMessage}</div>}
        <motion.div 
          className="question-list"
          variants={listVariants}
          initial="hidden"
          animate="show"
          key={selectedSetId}
        >
          {isCustomSelected && isAddingCustom && (
            <motion.article className="custom-editor-card" variants={itemVariants}>
              <textarea
                value={newCustomContent}
                onChange={(event) => setNewCustomContent(event.target.value)}
                placeholder="输入一道新的专属题目"
              />
              <div className="custom-editor-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleCreateCustomQuestion}
                  disabled={busyCustomId === "new"}
                >
                  {busyCustomId === "new" ? "保存中" : "保存题目"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setNewCustomContent("");
                  }}
                >
                  取消
                </button>
              </div>
            </motion.article>
          )}
          {(isCustomSelected ? customQuestions : selectedSet.questions).map((question, index) => (
            <motion.article className="question-card" key={question.id} variants={itemVariants}>
              <span className="question-number">{index + 1}</span>
              <p>{question.content}</p>
              <div className="question-actions">
                <button className="secondary-button" onClick={() => addToFreeMock(question)}>
                  <Plus size={16} />
                  加入模拟
                </button>
                {isCustomSelected && (
                  <button
                    className="icon-button danger"
                    title="删除题目"
                    onClick={() => handleDeleteCustomQuestion(question.id)}
                    disabled={busyCustomId === question.id}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.article>
          ))}
          {isCustomSelected && !customQuestions.length && (
            <motion.div className="empty-state" variants={itemVariants}>暂无专属题。可先到岗位信息页使用 AI 生题后加入题库。</motion.div>
          )}
        </motion.div>
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
