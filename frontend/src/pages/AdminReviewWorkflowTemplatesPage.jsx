import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

const AdminReviewWorkflowTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchPendingTemplates();
    // eslint-disable-next-line
  }, []);

  const fetchPendingTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/workflow-templates", {
        params: { status: "pending" },
      });
      setTemplates(res.data);
    } catch (err) {
      setTemplates([]);
    }
    setLoading(false);
  };

  const handleReview = async (id, status) => {
    setMsg("");
    try {
      await apiClient.post(`/workflow-templates/${id}/review`, null, {
        params: { status },
      });
      setMsg("审核成功！");
      fetchPendingTemplates();
    } catch (err) {
      setMsg("审核失败，请检查权限或网络。");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">待审核工作流模板</h1>
      {msg && <div className="mb-4 text-green-600">{msg}</div>}
      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-10 text-gray-400">暂无待审核模板</div>
      ) : (
        <div className="space-y-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-2">{tpl.title}</h2>
              <div className="mb-2 text-sm text-gray-500">分类：{tpl.category}</div>
              <div className="mb-2 text-gray-700">{tpl.description}</div>
              <div className="mb-2 text-xs text-gray-400">
                创建时间：{new Date(tpl.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => handleReview(tpl.id, "approved")}
                >
                  通过
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={() => handleReview(tpl.id, "rejected")}
                >
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewWorkflowTemplatesPage;