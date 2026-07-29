'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const MAX_INPUT_LENGTH = 500;
  const MAX_MESSAGES = 50;

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (trimmed.length > MAX_INPUT_LENGTH) {
      setError(`Message too long. Maximum ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setError('');
    setLoading(true);
    setInput('');

    const newUserMsg: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, newUserMsg].slice(-MAX_MESSAGES);
    setMessages(updatedMessages);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: fullText };
          }
          return next;
        });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
      <div className="h-96 overflow-y-auto p-4 space-y-4" id="chat-messages">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">Ask me anything</p>
            <p className="text-sm mt-1">I&apos;ll help with code, questions, and more.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.content || <span className="animate-pulse text-gray-500">Thinking...</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-900/50 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 border-t border-gray-800">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          maxLength={MAX_INPUT_LENGTH}
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        {loading ? (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        )}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-800 text-xs text-gray-600 flex justify-between">
        <span>{messages.length} messages</span>
        <span>Max {MAX_INPUT_LENGTH} chars</span>
      </div>
    </div>
  );
}