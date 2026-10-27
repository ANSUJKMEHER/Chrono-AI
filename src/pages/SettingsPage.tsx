import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sparkles,
  Zap,
  Clock,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sliders,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useToast } from '../components/common/Toast';
import { testAIConnection } from '../services/aiService';
import { UserSettings, PlanningStrategy } from '../types/task';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, loadDemoData, clearAllData } = useTasks();
  const { success, error, info } = useToast();

  const [form, setForm] = useState<UserSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    updateSettings(form);
    success('Settings saved successfully.');
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAIConnection(form);
      setTestResult(res);
      if (res.success) {
        success(res.message);
      } else {
        error(res.message);
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure preparation algorithms, working hours, and AI engine connections
        </p>
      </div>

      {/* AI Engine Configuration Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Intelligence Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose between live LLM parsing or built-in deterministic offline rules
            </p>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              form.aiProvider !== 'fallback_only' && form.apiKey
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {form.aiProvider !== 'fallback_only' && form.apiKey ? 'AI Enabled' : 'Fallback Parser'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Provider Mode
            </label>
            <select
              value={form.aiProvider}
              onChange={e => {
                const prov = e.target.value as any;
                let endpoint = form.apiEndpoint;
                let model = form.modelName;

                if (prov === 'nvidia') {
                  endpoint = 'https://integrate.api.nvidia.com/v1';
                  model = 'meta/llama-3.1-70b-instruct';
                } else if (prov === 'openai') {
                  endpoint = 'https://api.openai.com/v1';
                  model = 'gpt-4o-mini';
                }

                setForm((prev: UserSettings) => ({
                  ...prev,
                  aiProvider: prov,
                  apiEndpoint: endpoint,
                  modelName: model,
                }));
              }}
              className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="fallback_only">Deterministic Rule Parser (Offline / No Key Needed)</option>
              <option value="nvidia">NVIDIA NIM (Llama 3.1 70B Instruct)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="custom">Custom OpenAI-Compatible API Endpoint</option>
            </select>
          </div>

          {form.aiProvider !== 'fallback_only' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={e => setForm((prev: UserSettings) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API key (stored securely in browser localStorage only)..."
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Never transmitted to any third party server. Used strictly for direct client-to-API inference.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    API Endpoint
                  </label>
                  <input
                    type="text"
                    value={form.apiEndpoint}
                    onChange={e => setForm((prev: UserSettings) => ({ ...prev, apiEndpoint: e.target.value }))}
                    className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    value={form.modelName}
                    onChange={e => setForm((prev: UserSettings) => ({ ...prev, modelName: e.target.value }))}
                    className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !form.apiKey.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Testing connection...' : 'Test API Connection'}
                </button>

                {testResult && (
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      testResult.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    {testResult.message}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preparation Planning Constraints Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Preparation & Schedule Constraints
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Parameters used by the backward-scheduling engine to place prep blocks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={form.timezone}
              onChange={e => setForm((prev: UserSettings) => ({ ...prev, timezone: e.target.value }))}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Default Planning Strategy
            </label>
            <select
              value={form.planningStrategy}
              onChange={e =>
                setForm((prev: UserSettings) => ({
                  ...prev,
                  planningStrategy: e.target.value as PlanningStrategy,
                }))
              }
              className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="standard">Standard (Evenly spaced across remaining days)</option>
              <option value="early_bird">Early Bird (Finish 1 day before deadline)</option>
              <option value="intensive">Intensive (Concentrated in final 48 hours)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Working Hours Window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={form.preferredWorkingHours.start}
                onChange={e =>
                  setForm((prev: UserSettings) => ({
                    ...prev,
                    preferredWorkingHours: { ...prev.preferredWorkingHours, start: e.target.value },
                  }))
                }
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="time"
                value={form.preferredWorkingHours.end}
                onChange={e =>
                  setForm((prev: UserSettings) => ({
                    ...prev,
                    preferredWorkingHours: { ...prev.preferredWorkingHours, end: e.target.value },
                  }))
                }
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Daily Preparation Limit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="30"
                step="30"
                value={form.dailyPrepLimitMinutes}
                onChange={e =>
                  setForm((prev: UserSettings) => ({
                    ...prev,
                    dailyPrepLimitMinutes: parseInt(e.target.value, 10) || 180,
                  }))
                }
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                minutes / day ({Math.round(form.dailyPrepLimitMinutes / 60 * 10) / 10}h)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Demo & Data Management Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Hackathon Demonstration & Data Management
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset workspace, reload fresh demo sample assignments, or wipe storage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              loadDemoData();
              success('Demo data refreshed relative to current dates!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Fresh Demo Tasks</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all tasks and stored history?')) {
                clearAllData();
                info('All tasks and inbox history cleared.');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
