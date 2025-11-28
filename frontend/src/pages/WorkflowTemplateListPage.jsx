import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import WorkflowTemplateCard from "../components/common/WorkflowTemplateCard";

const categories = [
  { label: "全部", value: "" },
  { label: "图片生成", value: "IMAGE_GENERATOR" },
  { label: "文本生成", value: "TEXT_GENERATOR" },
  { label: "视频编辑", value: "VIDEO_EDITOR" },
  { label: "音频处理", value: "AUDIO_PROCESSOR" },
  { label: "市场营销", value: "MARKETING" },
  { label: "效率工具", value: "PRODUCTIVITY" },
  { label: "开发辅助", value: "DEVELOPMENT" },
  { label: "其他", value: "OTHER" },
];

const WorkflowTemplateListPage = () => {
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line
  }, [category]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/workflow-templates", {
        params: category ? { category } : {},
      });
      console.log("Fetched templates:", res.data);
      setTemplates(res.data);
    } catch (err) {
      // 错误处理
      setTemplates([]);
    }
    setLoading(false);
  };

  const handleCardClick = (template) => {
    navigate(`/workflow_templates/${template.id}`);

  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI 工作流/自动化模板中心</h1>
      <div className="mb-6 flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`px-4 py-2 rounded-full border ${
              category === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <WorkflowTemplateCard
              key={tpl.id}
              template={tpl}
              onNavigate={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplateListPage;