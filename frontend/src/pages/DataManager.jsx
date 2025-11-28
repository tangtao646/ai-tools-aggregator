import React, { useState } from 'react';
import adminApi from '../api/adminApi';
import BackButton from '../components/BackButton';
import CategoryMappingSection from '../components/CategoryMappingSection';

const DEFAULT_SECTIONS = [
  { key: 'seo_tools', title: 'Tools', description: 'Import or delete tools data (seo_tools.json format).' },
  { key: 'users', title: 'Users', description: 'Import or delete users data.' },
  { key: 'workflows', title: 'Workflows', description: 'Import or delete workflow templates.' }
];

const DataManager = () => {
  const [file, setFile] = useState(null);
  const [sectionFiles, setSectionFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  // no temporary mapping file needed; backend computes from DB
  const [error, setError] = useState(null);
  const [sections] = useState(DEFAULT_SECTIONS);

  const onFileChange = (sectionKey) => (e) => {
    const f = e.target.files[0];
    setSectionFiles(prev => ({ ...prev, [sectionKey]: f }));
    setResult(null);
    setError(null);
  };

  const onImport = async (sectionKey) => {
    const f = sectionFiles[sectionKey];
    if (!f) return setError('请选择一个 JSON 文件');
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Prefer existing seo import endpoint for seo_tools
      let resp;
      if (sectionKey === 'seo_tools' && adminApi.importSeoTools) {
        resp = await adminApi.importSeoTools(f);
      } else {
        resp = await adminApi.importTable(sectionKey, f);
      }
      setResult(resp);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data || String(err));
    } finally {
      setLoading(false);
    }
  };

  

  const onDelete = async (sectionKey) => {
    if (!confirm(`确定要删除表 ${sectionKey} 的所有数据吗？此操作不可撤销。`)) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await adminApi.deleteTable(sectionKey);
      setResult({ deleted: resp.deleted || true, message: resp.message || 'Deleted' });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <BackButton onClick={() => window.history.back()} variant="floating" />
      <CategoryMappingSection />

      {sections.map(section => (
        <section key={section.key} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <input id={`file-${section.key}`} type="file" accept="application/json" onChange={onFileChange(section.key)} />
              <button
                onClick={() => onImport(section.key)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                disabled={loading}
              >
                {loading ? 'Working...' : 'Import'}
              </button>
              
              <button
                onClick={() => onDelete(section.key)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                disabled={loading}
              >
                Delete Data
              </button>
            </div>
          </div>

          {/* result / error per section (shared single area) */}
          {error && (
            <div className="mt-2 text-red-600">Error: {String(error)}</div>
          )}

          

          {result && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
              <div className="text-sm mb-2">
                {result.message && <div><strong>Message:</strong> {result.message}</div>}
                {/* support multiple possible response shapes from backend/scripts */}
                {result.inserted !== undefined && <div><strong>Inserted:</strong> {String(result.inserted)}</div>}
                {result.updated !== undefined && <div><strong>Updated:</strong> {String(result.updated)}</div>}
                {result.skipped !== undefined && <div><strong>Skipped:</strong> {String(result.skipped)}</div>}
                {result.db_upserted !== undefined && <div><strong>DB upserted:</strong> {String(result.db_upserted)}</div>}
                {/* some scripts may return a nested summary */}
                {result.summary && result.summary.inserted !== undefined && (
                  <div><strong>Inserted:</strong> {String(result.summary.inserted)}</div>
                )}
              </div>
              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default DataManager;
