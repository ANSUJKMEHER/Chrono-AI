import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sparkles,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sliders,
  Moon,
  Sun,
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
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          <SettingsIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure preparation algorithms, dark/light themes, and AI engine connections
        </p>
      </div>

      {/* Appearance & Interface Theme Card */}
      <div className="p-6 glass-card rounded-3xl space-y-4 transition-colors">
        <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Interface Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose between Obsidian Dark (Linear aesthetic) or Clean Light (Amie aesthetic)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, theme: 'dark' }))}
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
              form.theme === 'dark'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-obsidian-850 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-400'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left">
              <div className="text-xs font-bold">Obsidian Dark</div>
              <div className="text-[11px] text-slate-400">Deep palette for high focus</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, theme: 'light' }))}
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
              form.theme === 'light'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-obsidian-850 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-400'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <div className="text-xs font-bold">Minimal Light</div>
              <div className="text-[11px] text-slate-400">Warm and clean day aesthetic</div>
            </div>
          </button>
        </div>
      </div>

      {/* AI Engine Configuration Card */}
      <div className="p-6 glass-card rounded-3xl space-y-5 transition-colors">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              AI Intelligence Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose between live LLM parsing or built-in deterministic offline rules
            </p>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              form.aiProvider !== 'fallback_only' && form.apiKey
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
            }`}
          >
            {form.aiProvider !== 'fallback_only' && form.apiKey ? 'AI Enabled' : 'Fallback Parser'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
                  model = 'nvidia/nemotron-3-ultra-550b-a55b';
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
              className="w-full text-xs font-medium p-2.5 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
            >
              <option value="fallback_only">Deterministic Rule Parser (Offline / No Key Needed)</option>
              <option value="nvidia">NVIDIA NIM (Nemotron 3 Ultra 550B - Active Hackathon Model)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="custom">Custom OpenAI-Compatible API Endpoint</option>
            </select>
          </div>

          {form.aiProvider !== 'fallback_only' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={e => setForm((prev: UserSettings) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API key (stored securely in browser localStorage only)..."
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Never transmitted to any third party server. Used strictly for direct client-to-API inference.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    API Endpoint
                  </label>
                  <input
                    type="text"
                    value={form.apiEndpoint}
                    onChange={e => setForm((prev: UserSettings) => ({ ...prev, apiEndpoint: e.target.value }))}
                    className="w-full text-xs font-mono p-2 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    value={form.modelName}
                    onChange={e => setForm((prev: UserSettings) => ({ ...prev, modelName: e.target.value }))}
                    className="w-full text-xs font-mono p-2 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !form.apiKey.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Testing connection...' : 'Test API Connection'}
                </button>

                {testResult && (
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
      <div className="p-6 glass-card rounded-3xl space-y-5 transition-colors">
        <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Preparation & Schedule Constraints
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Parameters used by the backward-scheduling engine to place prep blocks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={form.timezone}
              onChange={e => setForm((prev: UserSettings) => ({ ...prev, timezone: e.target.value }))}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
              className="w-full text-xs font-medium p-2.5 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
            >
              <option value="standard">Standard (Evenly spaced across remaining days)</option>
              <option value="early_bird">Early Bird (Finish 1 day before deadline)</option>
              <option value="intensive">Intensive (Concentrated in final 48 hours)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
                className="w-full text-xs p-2 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none"
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
                className="w-full text-xs p-2 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
                className="w-full text-xs p-2 bg-slate-50 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
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
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Demo & Data Management Card */}
      <div className="p-6 glass-card rounded-3xl space-y-4 transition-colors">
        <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Hackathon Demonstration & Data Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Reset workspace, reload fresh demo sample assignments, or wipe storage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              loadDemoData();
              success('Demo data refreshed relative to current dates!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold transition-colors"
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
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
