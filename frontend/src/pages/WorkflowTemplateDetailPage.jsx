import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import BackButton from '../components/BackButton';
import WorkflowTemplateCard from "../components/common/WorkflowTemplateCard";

const WorkflowTemplateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
    // eslint-disable-next-line
  }, [id]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/workflow-templates/${id}`);
      setTemplate(res.data);
    } catch (err) {
      setTemplate(null);
    }
    setLoading(false);
  };

  const handleCardClick = (template) => {
    navigate(`/workflow_templates/${template.id}`);
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">加载中...</div>;
  }
  if (!template) {
    return <div className="text-center py-10 text-red-500">未找到该模板</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton onClick={() => navigate(-1)} />
      <h1 className="text-3xl font-bold mb-4">{template.title}</h1>
      <div className="mb-2 text-sm text-gray-500">分类：{template.category}</div>
      <div className="mb-4 text-gray-700">{template.description}</div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">流程图描述</h2>
        <div className="bg-gray-50 p-4 rounded">{template.flow_chart_description}</div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">流程节点</h2>
        <ol className="list-decimal pl-6 space-y-4">
          {template.nodes &&
            template.nodes.map((node, idx) => (
              <li key={node.id || idx} className="bg-white rounded shadow p-4">
                <div className="font-semibold text-indigo-600 mb-1">
                  {node.tool_name}（步骤 {node.order}）
                </div>
                <div className="mb-2 text-gray-700">{node.description}</div>
                <div>
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                    Prompt: {node.prompt_template}
                  </span>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </div>
  );
};

export default WorkflowTemplateDetailPage;