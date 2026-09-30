import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Square, ArrowUp, Check, AlertTriangle, ChevronDown, ChevronRight, Loader2, Wrench, Copy, CircleStop } from 'lucide-react';
import type { AIMessage } from '../../lib/ai/aiStore';

export interface AIChatViewProps {
  messages: AIMessage[];
  isGenerating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  suggestions: string[];
  placeholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  renderActions?: (message: AIMessage) => React.ReactNode;
  /** Controlled draft so parent panels can pre-fill prompts. */
  draft: string;
  onDraftChange: (text: string) => void;
  disabledReason?: string | null;
  footer?: React.ReactNode;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const phaseLabel: Record<string, string> = {
  thinking: 'Thinking',
  writing: 'Writing code',
  compiling: 'Compiling',
  fixing: 'Self-healing',
};

const StreamingCode: React.FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [code]);
  return (
    <pre
      ref={ref}
      className="mt-2 max-h-48 overflow-hidden rounded-lg bg-[#0b0b0f] border border-[#00a8e8]/20 p-2.5 text-[10.5px] leading-[1.5] text-sky-100/80 font-mono whitespace-pre-wrap break-all [mask-image:linear-gradient(to_bottom,transparent,black_30%)]"
    >
      {code}
      <span className="inline-block w-1.5 h-3 -mb-0.5 bg-sky-400 animate-pulse" />
    </pre>
  );
};

const CodeDisclosure: React.FC<{ code: string }> = ({ code }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n').length;
  return (
    <div className="mt-2 rounded-lg border border-[#2a2a2a] bg-[#111] overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-gray-200"
          aria-expanded={open}
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="font-mono">component.tsx</span>
          <span className="text-gray-600">· {lines} lines</span>
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="px-2 py-1.5 text-gray-500 hover:text-gray-200"
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      {open && (
        <pre className="max-h-72 overflow-auto px-2.5 pb-2.5 text-[10.5px] leading-[1.5] text-gray-300 font-mono whitespace-pre">
          {code}
        </pre>
      )}
    </div>
  );
};

const AssistantMessage: React.FC<{ message: AIMessage; renderActions?: AIChatViewProps['renderActions'] }> = ({
  message,
  renderActions,
}) => {
  const streaming = message.status === 'streaming';
  const lines = message.code ? message.code.split('\n').length : 0;

  return (
    <div className="flex gap-2.5">
      <div
        className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#00a8e8] to-purple-500 ${
          streaming ? 'animate-pulse' : ''
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {message.content && <p className="text-[12.5px] leading-relaxed text-gray-200 whitespace-pre-wrap">{message.content}</p>}

        {streaming && (
          <div className="flex items-center gap-2 mt-1 text-[11px] text-sky-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>
              {phaseLabel[message.phase ?? 'thinking']}
              {message.phase === 'fixing' && message.fixAttempts ? ` (attempt ${message.fixAttempts})` : ''}
              {lines > 1 ? ` · ${lines} lines` : '…'}
            </span>
          </div>
        )}
        {streaming && message.code ? <StreamingCode code={message.code} /> : null}

        {message.status === 'done' && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px]">
            {message.reverted ? (
              <span className="text-gray-500">Reverted</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3 h-3" /> Compiled & applied
              </span>
            )}
            {!!message.fixAttempts && (
              <span className="flex items-center gap-1 text-amber-300/90">
                <Wrench className="w-3 h-3" /> self-healed {message.fixAttempts}×
              </span>
            )}
          </div>
        )}
        {message.status === 'error' && (
          <div className="mt-1.5 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
            <span className="break-words">{message.error || 'Generation failed'}</span>
          </div>
        )}
        {message.status === 'stopped' && (
          <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
            <CircleStop className="w-3 h-3" /> Stopped
          </div>
        )}

        {!streaming && message.code ? <CodeDisclosure code={message.code} /> : null}
        {!streaming && renderActions && <div className="mt-2 flex flex-wrap gap-1.5">{renderActions(message)}</div>}
      </div>
    </div>
  );
};

export const AIChatView: React.FC<AIChatViewProps> = ({
  messages,
  isGenerating,
  onSend,
  onStop,
  suggestions,
  placeholder,
  emptyTitle,
  emptySubtitle,
  renderActions,
  draft,
  onDraftChange,
  disabledReason,
  footer,
  inputRef,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? localInputRef;

  const last = messages[messages.length - 1];
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, last?.code, last?.content, last?.status]);

  // Auto-grow the composer
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(160, el.scrollHeight)}px`;
  }, [draft, textareaRef]);

  const submit = () => {
    const text = draft.trim();
    if (!text || isGenerating || disabledReason) return;
    onSend(text);
    onDraftChange('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="pt-4">
            <div className="relative mx-auto w-14 h-14 mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00a8e8] to-purple-500 blur-xl opacity-40 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a8e8] to-purple-500 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-center text-sm font-semibold text-white">{emptyTitle}</h3>
            <p className="text-center text-xs text-gray-500 mt-1 mb-4 px-2 leading-relaxed">{emptySubtitle}</p>
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  disabled={isGenerating || !!disabledReason}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2c2c2c] hover:border-[#00a8e8]/40 text-xs text-gray-300 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[88%] px-3 py-2 rounded-2xl rounded-br-md bg-[#00a8e8]/15 border border-[#00a8e8]/25 text-[12.5px] text-sky-50 whitespace-pre-wrap break-words">
                  {m.content}
                </div>
              </div>
            ) : (
              <AssistantMessage key={m.id} message={m} renderActions={renderActions} />
            ),
          )
        )}
      </div>

      {messages.length > 0 && !isGenerating && suggestions.length > 0 && (
        <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={!!disabledReason}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] text-[11px] text-gray-400 hover:text-gray-200 whitespace-nowrap disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-[#2a2a2a]">
        {footer}
        <div className="relative rounded-xl bg-[#202020] border border-[#333] focus-within:border-[#00a8e8] focus-within:shadow-[0_0_0_3px_rgba(0,168,232,0.12)] transition-all">
          <label htmlFor="ai-composer" className="sr-only">
            Prompt
          </label>
          <textarea
            id="ai-composer"
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder={disabledReason ?? placeholder}
            className="w-full resize-none bg-transparent px-3 pt-2.5 pb-9 text-[13px] text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          <div className="absolute bottom-2 left-3 text-[10px] text-gray-600 select-none">Enter to send · Shift+Enter newline</div>
          {isGenerating ? (
            <button
              onClick={onStop}
              className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square className="w-3 h-3 text-white fill-white" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!draft.trim() || !!disabledReason}
              className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-[#00a8e8] hover:bg-[#0096cf] disabled:bg-[#333] disabled:text-gray-500 text-white flex items-center justify-center transition-colors"
              title="Send"
              aria-label="Send prompt"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Small pill-style action button used inside message action rows.
export const ChatActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode; tone?: 'default' | 'accent' | 'danger' }
> = ({ icon, tone = 'default', className = '', children, ...rest }) => (
  <button
    {...rest}
    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors disabled:opacity-40 ${
      tone === 'accent'
        ? 'border-[#00a8e8]/30 bg-[#00a8e8]/10 text-sky-300 hover:bg-[#00a8e8]/20'
        : tone === 'danger'
          ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
          : 'border-[#333] bg-[#1d1d1d] text-gray-400 hover:text-gray-200 hover:bg-[#262626]'
    } ${className}`}
  >
    {icon}
    {children}
  </button>
);
