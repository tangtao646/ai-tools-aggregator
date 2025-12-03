import React, { useState, useEffect } from 'react';
import adminApi from '../api/adminApi';
import BackButton from '../components/BackButton';
import CategoryMappingSection from '../components/CategoryMappingSection';

const DEFAULT_SECTIONS = [
  { key: 'seo_tools', title: 'Tools', description: 'Import or delete tools data (seo_tools.json format).' },
  { key: 'users', title: 'Users', description: 'Import or delete users data.' },
  { key: 'workflows', title: 'Workflows', description: 'Import or delete workflow templates.' },
  { key: 'tool_translation', title: 'Tool Translation', description: 'Upload tools JSON and run resumable AI translation (server-side).' },

];

const DataManager = () => {
  // per-section state: { [sectionKey]: { file, loading, result, error, langCode } }
  const [sectionStates, setSectionStates] = useState({});
  const [showFullOutput, setShowFullOutput] = useState({});
  const [sections] = useState(DEFAULT_SECTIONS);
  const NO_IMPORT_KEYS = new Set(['tool_translation', 'tool_faq']);

  const setSectionState = (sectionKey, patch) => {
    setSectionStates(prev => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), ...patch } }));
  };

  // cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.keys(sectionStates).forEach(k => {
        const s = sectionStates[k];
        if (s && s._progressInterval) {
          clearInterval(s._progressInterval);
        }
      });
    };
  }, [sectionStates]);

  const getSectionState = (sectionKey) => {
    return sectionStates[sectionKey] || { file: null, loading: false, result: null, error: null, langCode: 'zh' };
  };

  // helper to clear any progress interval stored in state
  const clearProgressInterval = (sectionKey) => {
    const s = getSectionState(sectionKey);
    if (s._progressInterval) {
      clearInterval(s._progressInterval);
      setSectionState(sectionKey, { _progressInterval: null });
    }
  };

  const onFileChange = (sectionKey) => (e) => {
    const f = e.target.files[0];
    setSectionState(sectionKey, { file: f, result: null, error: null });
  };

  const onLangCodeChange = (sectionKey) => (e) => {
    setSectionState(sectionKey, { langCode: e.target.value });
  };

  const onImport = async (sectionKey) => {
    if (NO_IMPORT_KEYS.has(sectionKey)) return setSectionState(sectionKey, { error: '此部分不支持导入操作' });
    const s = getSectionState(sectionKey);
    const f = s.file;
    if (!f) return setSectionState(sectionKey, { error: '请选择一个 JSON 文件' });
    setSectionState(sectionKey, { loading: true, error: null, result: null });
    try {
      let resp;
      if (sectionKey === 'seo_tools' && adminApi.importSeoToolsAutoSplit) {
        // Pass langCode for SEO tools import
        resp = await adminApi.importSeoToolsAutoSplit(f, s.langCode || 'zh');
      } else {
        resp = await adminApi.importTable(sectionKey, f);
      }
      setSectionState(sectionKey, { result: resp });
    } catch (err) {
      console.error(err);
      setSectionState(sectionKey, { error: err?.response?.data || String(err) });
    } finally {
      setSectionState(sectionKey, { loading: false });
    }
  };



  const onDelete = async (sectionKey) => {
    if (!confirm(`确定要删除表 ${sectionKey} 的所有数据吗？此操作不可撤销。`)) return;
    setSectionState(sectionKey, { loading: true, error: null, result: null });
    try {
      const resp = await adminApi.deleteTable(sectionKey);
      setSectionState(sectionKey, { result: { deleted: resp.deleted || true, message: resp.message || 'Deleted' } });
    } catch (err) {
      console.error(err);
      setSectionState(sectionKey, { error: err?.response?.data || String(err) });
    } finally {
      setSectionState(sectionKey, { loading: false });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <BackButton onClick={() => window.history.back()} variant="floating" />
      <CategoryMappingSection />

      {sections.map(section => {
        const s = getSectionState(section.key);
        return (
          <section key={section.key} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {!NO_IMPORT_KEYS.has(section.key) && (
                  <>
                    {section.key === 'seo_tools' && (
                      <select 
                        value={s.langCode || 'zh'}
                        onChange={onLangCodeChange(section.key)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="zh">中文 (zh)</option>
                        <option value="en">English (en)</option>
                      </select>
                    )}
                    <input id={`file-${section.key}`} type="file" accept="application/json" onChange={onFileChange(section.key)} />
                    <button
                      onClick={() => onImport(section.key)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                      disabled={s.loading}
                    >
                      {s.loading ? 'Working...' : 'Import'}
                    </button>
                  </>
                )}

                {/* Special UI for tool translation section */}
                {section.key === 'tool_translation' && (
                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <select
                        value={s.langCode || 'zh'}
                        onChange={onLangCodeChange(section.key)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="zh">中文 (zh)</option>
                        <option value="en">English (en)</option>
                      </select>
                      <input id={`file-${section.key}`} type="file" accept="application/json" onChange={onFileChange(section.key)} className="text-sm" />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key (default: name)"
                        value={s.keyProperty || 'name'}
                        onChange={(e) => setSectionState(section.key, { keyProperty: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md w-40"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Delay (s)"
                        value={s.delay || 15}
                        onChange={(e) => setSectionState(section.key, { delay: Number(e.target.value) })}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            // start pseudo-progress and run translation
                            setSectionState(section.key, { loading: true, error: null, result: null, progress: 0 });
                            const f = s.file;
                            if (!f) return setSectionState(section.key, { error: '请选择一个 JSON 文件', loading: false });

                            // create abort controller and store it in state so Pause can access it
                            const controller = new AbortController();
                            setSectionState(section.key, { _abortController: controller });

                            // parse file to get total items (JSON array) and keep parsed items to show current name
                            let totalItems = null;
                            let parsedItems = null;
                            try {
                              const text = await new Promise((resolve, reject) => {
                                const fr = new FileReader();
                                fr.onload = () => resolve(fr.result);
                                fr.onerror = () => reject(new Error('读取文件失败'));
                                fr.readAsText(f);
                              });
                              const parsed = JSON.parse(text);
                              if (Array.isArray(parsed)) {
                                totalItems = parsed.length;
                                parsedItems = parsed;
                              }
                            } catch (e) {
                              // ignore parsing errors; totalItems stays null
                              totalItems = null;
                              parsedItems = null;
                            }

                            // start an interval to simulate per-item progress (will be cleared on completion)
                            let current = 0;
                            const keyProp = s.keyProperty || 'name';
                            const interval = setInterval(() => {
                              // increment current index until totalItems (if known) or keep increasing as indicator
                              if (totalItems) {
                                current = Math.min(totalItems, current + 1);
                              } else {
                                current = current + 1;
                              }

                              // determine current item's name if available
                              let currentName = '';
                              if (parsedItems && parsedItems.length >= current && current > 0) {
                                const v = parsedItems[current - 1][keyProp];
                                if (typeof v === 'string') currentName = v;
                                else if (v !== undefined && v !== null) currentName = String(v);
                              }

                              setSectionState(section.key, { currentIndex: current, totalItems, currentName, model: 'Gemini / OpenAI' });
                            }, Math.max(800, (s.delay || 15) * 1000 / 2));
                            setSectionState(section.key, { _progressInterval: interval, totalItems, currentIndex: 0, currentName: '', model: 'Gemini / OpenAI', parsedItems });

                            try {
                              const resp = await adminApi.translateTools(f, s.langCode || 'zh', s.keyProperty || 'name', s.delay || 15, controller.signal);
                              // compute final progress if stats available
                              let finalProgress = 100;
                              if (resp && resp.stats && resp.stats.total_items) {
                                const total = resp.stats.total_items;
                                const processed = (resp.stats.skipped_count || 0) + (resp.stats.newly_successful_count || 0) + (resp.stats.newly_failed_count || 0);
                                finalProgress = Math.min(100, Math.floor((processed / Math.max(1, total)) * 100));
                              }
                              clearInterval(interval);
                              // finalize currentIndex to total if we know it
                              const respTotal = resp && resp.stats && resp.stats.total_items ? resp.stats.total_items : null;
                              const finalIndex = respTotal || totalItems || current || s.currentIndex || 0;
                              setSectionState(section.key, { result: resp, currentIndex: finalIndex, totalItems: respTotal || totalItems, model: (resp && resp.used_model) ? resp.used_model : (s.model || 'Gemini / OpenAI'), _progressInterval: null, _abortController: null });
                            } catch (err) {
                              console.error(err);
                              clearInterval(interval);
                              const isAbort = err.name === 'CanceledError' || err.message === 'canceled' || err?.code === 'ERR_CANCELED';
                              setSectionState(section.key, { error: isAbort ? '已暂停' : (err?.response?.data || String(err)), _progressInterval: null, _abortController: null });
                            } finally {
                              setSectionState(section.key, { loading: false });
                            }
                          }}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
                          disabled={s.loading}
                        >
                          {s.loading ? 'Running...' : 'Start Translation'}
                        </button>

                          {/* Pause button: only shown while running */}
                          {s.loading && (
                            <button
                              onClick={() => {
                                // abort the inflight request and clear progress interval
                                if (s._abortController) {
                                  try { s._abortController.abort(); } catch (e) { /* ignore */ }
                                }
                                if (s._progressInterval) {
                                  clearInterval(s._progressInterval);
                                  setSectionState(section.key, { _progressInterval: null });
                                }
                                setSectionState(section.key, { loading: false, error: '已暂停', _abortController: null });
                              }}
                              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                            >
                              Pause
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {section.key === 'tool_translation' ? (
                  <button
                    onClick={() => {
                      // Prefer downloading the currently selected file in the browser
                      const f = s.file;
                      if (!f) return setSectionState(section.key, { error: '没有可下载的文件' });
                      const url = URL.createObjectURL(f);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = f.name || 'tools.json';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    disabled={s.loading}
                  >
                    Download File
                  </button>
                ) : (
                  <button
                    onClick={() => onDelete(section.key)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                    disabled={s.loading}
                  >
                    Delete Data
                  </button>
                )}
              </div>
            </div>

            {/* result / error per section */}
            {(section.key === 'tool_translation' && (s.loading || s.currentIndex || s.totalItems)) && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="text-gray-600">正在翻译</div>
                  <div className="text-gray-600">
                    {s.currentIndex ? (`正在翻译第 ${s.currentIndex}/${s.totalItems || '?'} 条数据`) : '准备中...'}
                    {s.currentName ? ` （${s.currentName}）` : (s.model ? ` （${s.model}）` : '')}
                  </div>
                </div>
              </div>
            )}
            {s.error && (
              <div className="mt-2 text-red-600">Error: {String(s.error)}</div>
            )}

            {s.result && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-sm mb-2">
                  {s.result.message && <div><strong>Message:</strong> {s.result.message}</div>}
                  {s.result.lang_code && <div><strong>Language:</strong> {s.result.lang_code}</div>}
                  {s.result.inserted !== undefined && <div><strong>Inserted:</strong> {String(s.result.inserted)}</div>}
                  {s.result.updated !== undefined && <div><strong>Updated:</strong> {String(s.result.updated)}</div>}
                  {s.result.skipped !== undefined && <div><strong>Skipped:</strong> {String(s.result.skipped)}</div>}
                  {s.result.failed !== undefined && s.result.failed > 0 && <div className="text-red-600"><strong>Failed:</strong> {String(s.result.failed)}</div>}
                  {s.result.db_upserted !== undefined && <div><strong>DB upserted:</strong> {String(s.result.db_upserted)}</div>}
                  {s.result.summary && s.result.summary.inserted !== undefined && (
                    <div><strong>Inserted:</strong> {String(s.result.summary.inserted)}</div>
                  )}

                  {typeof s.result.stdout === 'string' && s.result.stdout.length > 0 && (
                    <div className="mt-2">
                      <strong>Import Output:</strong>
                      <div className="mt-1 text-xs text-gray-700">
                        {showFullOutput[section.key]?.stdout ? (
                          <pre className="whitespace-pre-wrap text-xs">{s.result.stdout}</pre>
                        ) : (
                          <pre className="whitespace-pre-wrap text-xs">{s.result.stdout.slice(0, 500)}{s.result.stdout.length > 500 ? '...': ''}</pre>
                        )}
                        {s.result.stdout.length > 500 && (
                          <button
                            className="mt-1 text-sm text-blue-600"
                            onClick={() => setShowFullOutput(prev => ({ ...prev, [section.key]: { ...(prev[section.key] || {}), stdout: !((prev[section.key] || {}).stdout) } }))}
                          >
                            {showFullOutput[section.key]?.stdout ? 'Hide full output' : 'Show full output'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {typeof s.result.stderr === 'string' && s.result.stderr.length > 0 && (
                    <div className="mt-2">
                      <strong>Import Errors:</strong>
                      <div className="mt-1 text-xs text-red-700">
                        {showFullOutput[section.key]?.stderr ? (
                          <pre className="whitespace-pre-wrap text-xs">{s.result.stderr}</pre>
                        ) : (
                          <pre className="whitespace-pre-wrap text-xs">{s.result.stderr.slice(0, 300)}{s.result.stderr.length > 300 ? '...': ''}</pre>
                        )}
                        {s.result.stderr.length > 300 && (
                          <button
                            className="mt-1 text-sm text-blue-600"
                            onClick={() => setShowFullOutput(prev => ({ ...prev, [section.key]: { ...(prev[section.key] || {}), stderr: !((prev[section.key] || {}).stderr) } }))}
                          >
                            {showFullOutput[section.key]?.stderr ? 'Hide errors' : 'Show full errors'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default DataManager;
