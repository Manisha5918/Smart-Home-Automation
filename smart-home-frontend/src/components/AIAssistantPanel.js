import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, MessageSquare, Mic, Volume2, ChevronDown, Trash2 } from 'lucide-react';
import { aiAssistantService } from '../services/aiAssistantService';
import VoiceInput from './VoiceInput';

const SUGGESTED_PROMPTS = [
  'How much energy did I use today?',
  'Which device consumes the most power?',
  'Turn on the lights',
  'Show my dashboard',
  'Is any device unhealthy?',
  'Give me energy-saving tips',
  'Any important notifications?',
  'Generate a daily report',
];

const AIAssistantPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi! I'm your Smart Home Assistant. Ask me anything about your home." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const cancelRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    setStreamingText('');

    let fullResponse = '';
    cancelRef.current = aiAssistantService.streamChat(msg,
      (chunk) => {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      },
      (error) => {
        setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${error}`, isError: true }]);
        setStreamingText('');
        setLoading(false);
      },
      () => {
        setMessages(prev => [...prev, { sender: 'ai', text: fullResponse }]);
        setStreamingText('');
        setLoading(false);
      }
    );
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    try {
      await aiAssistantService.clearConversation();
      setMessages([{ sender: 'ai', text: 'Conversation cleared. How can I help you?' }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Failed to clear conversation.', isError: true }]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-50"
        style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          style={{ maxWidth: 'calc(100vw - 48px)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Bot size={22} />
              <div>
                <h3 className="font-bold text-sm">Smart Home AI</h3>
                <p className="text-xs opacity-80">Online · Ask me anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="Clear conversation">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-white'
                    : msg.isError
                      ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                }`}>
                  {msg.sender === 'user' ? 'U' : <Bot size={14} />}
                </div>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-white rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && streamingText && (
              <div className="flex gap-2.5 flex-row">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 shrink-0">
                  <Bot size={14} />
                </div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {loading && !streamingText && (
              <div className="flex gap-2.5 flex-row">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 shrink-0">
                  <Bot size={14} />
                </div>
                <div className="px-3.5 py-3 rounded-xl bg-gray-100 dark:bg-gray-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested prompts (when no loading) */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-900/30 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your home..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                disabled={loading}
              />
              <VoiceInput onResult={(text) => setInput(prev => prev + ' ' + text)} />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantPanel;
