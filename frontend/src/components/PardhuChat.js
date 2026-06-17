import React, { useState, useRef, useEffect, useCallback } from 'react';
import { buildGrounding, askPardhu } from '../utils/pardhu';
import './PardhuChat.css';

const STORAGE_KEY = 'pardhu_chat_history_v1';
const WELCOME = {
  role: 'assistant',
  content: `Hi — I'm Pardhu, your AI analyst for Indian elections. Ask me about parties, states, alliance maths, vote shares, swings, or what to watch for in upcoming polls.`,
};

const QUICK_PROMPTS = [
  'Who won UP in 2024?',
  'How did BJP perform vs INDIA in Maharashtra?',
  'Predict the next Bihar assembly result',
  'Which states is NDA strongest in?',
  'Caste composition impact on UP elections',
];

export default function PardhuChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch { /* ignore */ }
    return [WELCOME];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Persist history (skip the welcome-only state)
  useEffect(() => {
    if (messages.length > 1) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const send = useCallback(async (text) => {
    const userMsg = text ?? input;
    if (!userMsg.trim() || loading) return;
    const userTurn = { role: 'user', content: userMsg.trim() };
    setMessages(m => [...m, userTurn]);
    setInput('');
    setLoading(true);

    try {
      // 1) Build grounding from the dashboard's API
      const grounding = await buildGrounding(userMsg).catch(() => '');
      // 2) Call backend /api/chat (Groq → Pollinations → fallback)
      const { reply, provider } = await askPardhu(messages.slice(1), userMsg, grounding);
      setMessages(m => [...m, { role: 'assistant', content: reply, provider }]);
      if (!open) setUnread(true);
    } catch (err) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: `Something went wrong while I was answering: ${err.message}. Please try again.`,
        provider: 'error',
      }]);
    }
    setLoading(false);
  }, [input, loading, messages, open]);

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([WELCOME]);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          className="pardhu-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open Pardhu chat"
          title="Ask Pardhu — your election AI"
        >
          <div className="pardhu-launcher-icon">
            <PardhuAvatar />
            {unread && <span className="pardhu-unread-dot" />}
          </div>
          <span className="pardhu-launcher-label">
            Ask <b>Pardhu</b>
          </span>
        </button>
      )}

      {/* Expanded chat window */}
      {open && (
        <div className="pardhu-panel" role="dialog" aria-label="Pardhu chat">
          <header className="pardhu-header">
            <div className="pardhu-header-id">
              <div className="pardhu-header-avatar"><PardhuAvatar /></div>
              <div>
                <div className="pardhu-header-name">Pardhu</div>
                <div className="pardhu-header-status">
                  <span className="pardhu-online-dot" /> AI Election Analyst
                </div>
              </div>
            </div>
            <div className="pardhu-header-actions">
              <button
                className="pardhu-header-btn"
                onClick={clearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
              <button
                className="pardhu-header-btn"
                onClick={() => setOpen(false)}
                title="Minimize"
                aria-label="Minimize"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="6" y1="18" x2="18" y2="6" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          <div className="pardhu-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`pardhu-msg pardhu-msg-${m.role}`}>
                {m.role === 'assistant' && <div className="pardhu-msg-avatar"><PardhuAvatar small /></div>}
                <div className="pardhu-msg-col">
                  <div className="pardhu-msg-bubble">{m.content}</div>
                  {m.role === 'assistant' && m.provider && m.provider !== 'fallback' && m.provider !== 'error' && (
                    <div className="pardhu-msg-provider">via {m.provider}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="pardhu-msg pardhu-msg-assistant">
                <div className="pardhu-msg-avatar"><PardhuAvatar small /></div>
                <div className="pardhu-msg-bubble pardhu-msg-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts — only show while conversation is fresh */}
          {messages.length <= 1 && (
            <div className="pardhu-quick">
              <div className="pardhu-quick-label">Try asking:</div>
              <div className="pardhu-quick-pills">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} className="pardhu-quick-pill" onClick={() => send(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}

          <div className="pardhu-input-row">
            <textarea
              ref={inputRef}
              className="pardhu-input"
              placeholder={loading ? 'Pardhu is thinking…' : 'Ask about parties, states, predictions…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
              rows={1}
            />
            <button
              className="pardhu-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="pardhu-footer">
            <span>Grounded on your dashboard's database · <b>Llama 3.3</b> via Groq · fallback Pollinations</span>
          </div>
        </div>
      )}
    </>
  );
}

// Compact monogram avatar — saffron→blue gradient with "P" letterform
function PardhuAvatar({ small = false }) {
  const size = small ? 22 : 32;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id="pardhu-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8B33" />
          <stop offset="100%" stopColor="#0047AB" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#pardhu-grad)" />
      <text x="18" y="24"
        textAnchor="middle"
        fontFamily="'Source Serif Pro', Georgia, serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff">P</text>
    </svg>
  );
}
