import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { useAIStore } from '../../lib/ai/aiStore';
import { PROVIDERS, listModels, streamChat, type AIProviderId } from '../../lib/ai/providers';

const PROVIDER_ORDER: AIProviderId[] = ['openai', 'anthropic', 'gemini', 'openrouter', 'groq', 'ollama', 'custom'];

export const AISettingsModal: React.FC = () => {
  const open = useAIStore((s) => s.settingsOpen);
  const setOpen = useAIStore((s) => s.setSettingsOpen);
  const settings = useAIStore((s) => s.settings);
  const updateSettings = useAIStore((s) => s.updateSettings);
  const setProviderValue = useAIStore((s) => s.setProviderValue);
  const getActiveConfig = useAIStore((s) => s.getActiveConfig);

  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<Partial<Record<AIProviderId, string[]>>>({});
  const [busy, setBusy] = useState<'models' | 'test' | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  if (!open) return null;

  const provider = settings.provider;
  const meta = PROVIDERS[provider];
  const apiKey = settings.keys[provider] ?? '';
  const model = settings.models[provider] ?? meta.defaultModel;
  const baseUrl = settings.baseUrls[provider] ?? meta.defaultBaseUrl;
  const modelOptions = Array.from(new Set([...(models[provider] ?? []), ...meta.suggestedModels]));

  const handleFetchModels = async () => {
    setBusy('models');
    setStatus(null);
    try {
      const list = await listModels(getActiveConfig());
      setModels((m) => ({ ...m, [provider]: list }));
      setStatus({ ok: true, text: `Found ${list.length} models.` });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    setBusy('test');
    setStatus(null);
    try {
      const reply = await streamChat({
        config: { ...getActiveConfig(), maxTokens: 20 },
        system: 'You are a connection test. Reply with exactly: OK',
        messages: [{ role: 'user', content: 'Ping' }],
      });
      setStatus({ ok: true, text: `Connected. Model replied: "${reply.trim().slice(0, 40) || '(empty)'}"` });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const inputCls =
    'w-full px-3 py-2 bg-[#111] border border-[#333] rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#00a8e8] focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-settings-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#161616] border border-[#333] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00a8e8] to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 id="ai-settings-title" className="text-sm font-semibold text-white">AI Provider</h2>
              <p className="text-xs text-gray-500">Bring your own key. Pick any model that writes good React.</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-[#252525] text-gray-400" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Provider grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROVIDER_ORDER.map((id) => {
              const p = PROVIDERS[id];
              const active = id === provider;
              const hasKey = !p.needsKey || !!settings.keys[id];
              return (
                <button
                  key={id}
                  onClick={() => {
                    updateSettings({ provider: id });
                    setStatus(null);
                  }}
                  className={`relative text-left p-3 rounded-xl border transition-all ${
                    active
                      ? 'border-[#00a8e8] bg-[#00a8e8]/10 shadow-[0_0_0_1px_rgba(0,168,232,0.4)]'
                      : 'border-[#2a2a2a] bg-[#1c1c1c] hover:border-[#444]'
                  }`}
                  aria-pressed={active}
                >
                  <div className="text-xs font-semibold text-white">{p.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{p.description}</div>
                  {hasKey && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400" title="Ready" />
                  )}
                </button>
              );
            })}
          </div>

          {/* API key */}
          {meta.needsKey && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="ai-key" className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> {meta.label} API key
                </label>
                {meta.keyUrl && (
                  <a href={meta.keyUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#00a8e8] hover:underline flex items-center gap-1">
                    Get a key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  id="ai-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setProviderValue('keys', provider, e.target.value)}
                  placeholder="Paste your key"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${inputCls} pr-10 font-mono`}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Model */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="ai-model" className="text-xs font-medium text-gray-400">Model</label>
              <button
                onClick={handleFetchModels}
                disabled={busy !== null || (meta.needsKey && !apiKey)}
                className="text-[11px] text-[#00a8e8] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${busy === 'models' ? 'animate-spin' : ''}`} /> Fetch available models
              </button>
            </div>
            <input
              id="ai-model"
              list="ai-model-options"
              value={model}
              onChange={(e) => setProviderValue('models', provider, e.target.value)}
              placeholder="model id"
              spellCheck={false}
              className={`${inputCls} font-mono`}
            />
            <datalist id="ai-model-options">
              {modelOptions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-[10px] text-gray-600 mt-1">Model ids change often. Use “Fetch” to list what your key can access.</p>
          </div>

          {/* Base URL */}
          {meta.baseUrlEditable && (
            <div>
              <label htmlFor="ai-base" className="text-xs font-medium text-gray-400 block mb-1.5">Base URL</label>
              <input
                id="ai-base"
                value={baseUrl}
                onChange={(e) => setProviderValue('baseUrls', provider, e.target.value)}
                spellCheck={false}
                className={`${inputCls} font-mono`}
              />
              {!meta.needsKey && (
                <div className="mt-2">
                  <label htmlFor="ai-key-opt" className="text-[11px] text-gray-500 block mb-1">API key (optional)</label>
                  <input
                    id="ai-key-opt"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setProviderValue('keys', provider, e.target.value)}
                    autoComplete="off"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Behaviour */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoFix}
                onChange={(e) => updateSettings({ autoFix: e.target.checked })}
                className="mt-0.5 accent-[#00a8e8]"
              />
              <span>
                <span className="block text-xs font-medium text-white">Self-healing code</span>
                <span className="block text-[10px] text-gray-500">Send compile & runtime errors back to the model automatically</span>
              </span>
            </label>
            <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a]">
              <label htmlFor="ai-fix-attempts" className="block text-xs font-medium text-white mb-1">
                Max repair attempts: {settings.maxFixAttempts}
              </label>
              <input
                id="ai-fix-attempts"
                type="range"
                min={0}
                max={4}
                value={settings.maxFixAttempts}
                onChange={(e) => updateSettings({ maxFixAttempts: parseInt(e.target.value, 10) })}
                className="w-full accent-[#00a8e8]"
              />
            </div>
          </div>

          {status && (
            <div
              role="status"
              className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                status.ok ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
              }`}
            >
              {status.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span className="break-words">{status.text}</span>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/80">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              Keys are stored in this browser's localStorage and sent directly from your browser to the provider. Use a
              key with a spending limit and don't use this on shared machines.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={handleTest}
            disabled={busy !== null}
            className="px-4 py-2 rounded-lg bg-[#252525] hover:bg-[#333] text-sm text-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            {busy === 'test' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Test connection
          </button>
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-[#00a8e8] hover:bg-[#0086b6] text-sm font-medium text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
