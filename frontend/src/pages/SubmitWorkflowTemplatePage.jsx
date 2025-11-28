import React, { useState } from "react";
import apiClient from "../../api/apiClient";

const categories = [
  { label: "图片生成", value: "IMAGE_GENERATOR" },
  { label: "文本生成", value: "TEXT_GENERATOR" },
  { label: "视频编辑", value: "VIDEO_EDITOR" },
  { label: "音频处理", value: "AUDIO_PROCESSOR" },
  { label: "市场营销", value: "MARKETING" },
  { label: "效率工具", value: "PRODUCTIVITY" },
  { label: "开发辅助", value: "DEVELOPMENT" },
  { label: "其他", value: "OTHER" },
];

const emptyNode = { tool_name: "", description: "", prompt_template: "" };

const SubmitWorkflowTemplatePage = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "IMAGE_GENERATOR",
    flow_chart_description: "",
    nodes: [ { ...emptyNode } ],
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNodeChange = (idx, field, value) => {
    const nodes = form.nodes.map((node, i) =>
      i === idx ? { ...node, [field]: value } : node
    );
    setForm({ ...form, nodes });
  };

  const addNode = () => {
    setForm({ ...form, nodes: [...form.nodes, { ...emptyNode }] });
  };

  const removeNode = (idx) => {
    setForm({ ...form, nodes: form.nodes.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await apiClient.post("/workflow-templates", form);
      setMsg("提交成功，等待审核！");
      setForm({
        title: "",
        description: "",
        category: "IMAGE_GENERATOR",
        flow_chart_description: "",
        nodes: [ { ...emptyNode } ],
      });
    } catch (err) {
      setMsg("提交失败，请检查内容或登录状态。");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">提交新的工作流模板</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">模板名称</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">模板描述</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">分类</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">流程图描述</label>
          <textarea
            name="flow_chart_description"
            value={form.flow_chart_description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-2">流程节点</label>
          {form.nodes.map((node, idx) => (
            <div key={idx} className="mb-4 p-4 border rounded bg-gray-50">
              <div className="mb-2">
                <input
                  placeholder="工具名称（如 GPT-4）"
                  value={node.tool_name}
                  onChange={(e) =>
                    handleNodeChange(idx, "tool_name", e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div className="mb-2">
                <input
                  placeholder="节点描述"
                  value={node.description}
                  onChange={(e) =>
                    handleNodeChange(idx, "description", e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Prompt 模板"
                  value={node.prompt_template}
                  onChange={(e) =>
                    handleNodeChange(idx, "prompt_template", e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              {form.nodes.length > 1 && (
                <button
                  type="button"
                  className="mt-2 text-xs text-red-500"
                  onClick={() => removeNode(idx)}
                >
                  删除节点
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded"
            onClick={addNode}
          >
            添加流程节点
          </button>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? "提交中..." : "提交"}
        </button>
        {msg && <div className="mt-4 text-center text-green-600">{msg}</div>}
      </form>
    </div>
  );
};

export default SubmitWorkflowTemplatePage;