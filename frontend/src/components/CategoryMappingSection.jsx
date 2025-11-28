import React, { useState } from 'react';
import adminApi from '../api/adminApi';

const CategoryMappingSection = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [mappingEdits, setMappingEdits] = useState({});
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const onEditDisplay = (orig) => (e) => {
    const val = e.target.value;
    setMappingEdits(prev => ({ ...prev, [orig]: { ...(prev[orig]||{}), display: val } }));
  };

  const onToggleInclude = (orig) => (e) => {
    const checked = e.target.checked;
    setMappingEdits(prev => ({ ...prev, [orig]: { ...(prev[orig]||{}), include: checked } }));
  };

  

  const generatePreview = async () => {
    setLoading(true);
    setStatusMessage('Generating mapping — calling LLM...');
    setError(null);
    try {
      const resp = await adminApi.generateCategoryMapping(undefined, false);
      setPreview(resp);
      const base = resp.merged_mapping || resp.new_mappings || {};
      const edits = {};
      Object.keys(base).forEach(k => { edits[k] = { display: base[k], include: true }; });
      setMappingEdits(edits);
      setStatusMessage('Generation complete — edit and Confirm & Save');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data || String(err);
      setError(msg);
      setStatusMessage('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const commitMapping = async () => {
    if (!confirm('确认要将当前映射写入映射文件并 upsert 到 DB 吗？')) return;
    setLoading(true);
    setError(null);
    setStatusMessage('Saving mapping and upserting to DB...');
    try {
      const mappingOverride = {};
      Object.entries(mappingEdits).forEach(([orig, data]) => {
        if (data && data.include) mappingOverride[orig] = data.display;
      });
      const resp = await adminApi.generateCategoryMapping(undefined, true, mappingOverride);
      setResult(resp);
      setStatusMessage('Save complete');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data || String(err);
      setError(msg);
      setStatusMessage('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const clearCategoryMappingTable = async () => {
    if (!confirm('确认要清空 `category_mapping` 表吗？此操作不可撤销。')) return;
    setLoading(true);
    setError(null);
    try {
      // backend exposes DELETE /admin/delete/:table
      const resp = await adminApi.deleteTable('category_mapping');
      setResult(resp);
      // clear preview/editor
      setPreview(null);
      setMappingEdits({});
    } catch (err) {
      console.error(err);
      setError(err?.response?.data || String(err));
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Category Mapping</h3>
          <p className="text-sm text-gray-500">Generate, preview/edit, commit (save & insert DB), or delete category mappings.</p>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(mappingEdits).length === 0 ? (
            <button onClick={generatePreview} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md" disabled={loading}>Generate Mapping</button>
          ) : (
            <button onClick={commitMapping} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md" disabled={loading}>Confirm & Save</button>
          )}
          <button onClick={clearCategoryMappingTable} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Clear Mapping Table</button>
        </div>
      </div>
        {statusMessage && (
          <div className="mt-3 text-sm text-gray-600">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-700" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                <span>{statusMessage}</span>
              </span>
            ) : (
              <span>{statusMessage}</span>
            )}
          </div>
        )}

      

      {preview && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-medium">Preview (not saved):</div>
          <div className="text-sm text-gray-600">{preview.message || 'Preview generated'} {preview.used_fallback ? '(used fallback)' : ''}</div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-1">Include</th>
                  <th className="px-2 py-1">Original Category</th>
                  <th className="px-2 py-1">Display Category (editable)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(mappingEdits).length === 0 && (
                  <tr><td colSpan={3} className="px-2 py-2 text-gray-500">No preview items</td></tr>
                )}
                {Object.entries(mappingEdits).map(([orig, data]) => (
                  <tr key={orig} className="align-top">
                    <td className="px-2 py-1"><input type="checkbox" checked={!!data.include} onChange={onToggleInclude(orig)} /></td>
                    <td className="px-2 py-1 font-mono text-gray-800">{orig}</td>
                    <td className="px-2 py-1"><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={data.display} onChange={onEditDisplay(orig)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-sm text-gray-700">Selected rows: {Object.values(mappingEdits).filter(i => i && i.include).length}</div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-600">Error: {String(error)}</div>
      )}

      {result && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
          <div className="text-sm mb-2">
            {result.message && <div><strong>Message:</strong> {result.message}</div>}
            {result.inserted !== undefined && <div><strong>Inserted:</strong> {String(result.inserted)}</div>}
            {result.updated !== undefined && <div><strong>Updated:</strong> {String(result.updated)}</div>}
            {result.skipped !== undefined && <div><strong>Skipped:</strong> {String(result.skipped)}</div>}
            {result.db_upserted !== undefined && <div><strong>DB upserted:</strong> {String(result.db_upserted)}</div>}
            {result.summary && result.summary.inserted !== undefined && (<div><strong>Inserted:</strong> {String(result.summary.inserted)}</div>)}
          </div>
          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
};

export default CategoryMappingSection;
