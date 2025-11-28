import React from "react";

const WorkflowTemplateCard = ({ template, onNavigate }) => {
  
  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between h-full cursor-pointer hover:shadow-lg transition"
      onClick={() => onNavigate(template)}
    >
      <div>
        <h2 className="text-xl font-semibold mb-2">{template.title}</h2>
        <div className="mb-2 text-sm text-gray-500">
          分类：{template.category}
        </div>
        <div className="mb-4 text-gray-700 line-clamp-3">
          {template.description}
        </div>
        <div className="mb-2 text-xs text-gray-400">
          创建时间：{new Date(template.created_at).toLocaleDateString()}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {template.nodes &&
            template.nodes.map((node, idx) => (
              <span
                key={node.id || idx}
                className="bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 text-xs"
              >
                {node.tool_name}
              </span>
            ))}
        </div>
      </div>
      <div className="mt-4">
        {/* ...existing code... */}
      </div>
    </div>
  );
};

export default WorkflowTemplateCard;


