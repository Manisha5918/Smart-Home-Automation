import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { aiAssistantService } from '../services/aiAssistantService';
import { aiChatService } from '../services/api';
import Skeleton from '../components/Skeleton';
import VoiceInput from '../components/VoiceInput';
import { motion, AnimatePresence } from 'framer-motion';
import { chipHover } from '../utils/motionVariants';
import useReducedMotion from '../utils/useReducedMotion';
import {
  Brain, Send, Bot, User, Zap, History, Wrench, FileText, Trash2, Info, Mic, Loader
} from 'lucide-react';
import { formatInline, parseMarkdown } from '../utils/markdownHelpers';

const SAMPLE_PROMPTS = [
  { text: 'How much energy did I use today?', icon: <Zap size={14} /> },
  { text: 'Show my routines', icon: <History size={14} /> },
  { text: 'Check device health', icon: <Wrench size={14} /> },
  { text: 'Generate a daily report', icon: <FileText size={14} /> },
];

const REPORT_TYPES = ['daily', 'weekly', 'monthly', 'energy', 'devicehealth', 'security', 'automation'];

const AIChat = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [messages, setMessages] = useState([
    { sender: 'ai', text: t('aiChat.initialMessage') }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [routines, setRoutines] = useState([]);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [showContext, setShowContext] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const chatEndRef = useRef(null);
  const cancelRef = useRef(null);

  const scrollChat = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollChat(); }, [messages, loading, streamingText]);

  useEffect(() => {
    const fetchRoutines = async () => {
      setRoutinesLoading(true);
      try {
        const data = await aiChatService.getRoutines();
        setRoutines(data.routines || []);
      } catch (err) {
        console.warn('Failed to load routines:', err);
      } finally {
        setRoutinesLoading(false);
      }
    };
    fetchRoutines();
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const ctx = await aiAssistantService.getContext();
      setContext(ctx);
    } catch { }
  }, []);

  const handleSendMessage = useCallback(async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInputMessage('');
    setLoading(true);
    setStreamingText('');

    let fullResponse = '';
    cancelRef.current = aiAssistantService.streamChat(textToSend,
      (chunk) => {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      },
      (error) => {
        setMessages(prev => [...prev, { sender: 'ai', text: `**Error**: ${error}`, isError: true }]);
        setStreamingText('');
        setLoading(false);
      },
      () => {
        setMessages(prev => [...prev, { sender: 'ai', text: fullResponse }]);
        setStreamingText('');
        setLoading(false);
      }
    );
  }, [inputMessage, loading]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  const handleGenerateReport = async (type) => {
    setMessages(prev => [...prev, { sender: 'user', text: `Generate ${type} report` }]);
    setLoading(true);
    setStreamingText('');

    try {
      const data = await aiAssistantService.generateFullReport(type);
      setMessages(prev => [...prev, { sender: 'ai', text: data.report || data.message || 'Report generated.' }]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Report generation failed.';
      setMessages(prev => [...prev, { sender: 'ai', text: `**Error**: ${errorMsg}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = async (cmd) => {
    setMessages(prev => [...prev, { sender: 'user', text: `Execute: ${cmd}` }]);
    setLoading(true);
    try {
      const data = await aiAssistantService.executeCommand(cmd);
      setMessages(prev => [...prev, { sender: 'ai', text: data.result || data.message || 'Command executed.' }]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Command execution failed.';
      setMessages(prev => [...prev, { sender: 'ai', text: `**Error**: ${errorMsg}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const renderStreamingBubble = () => {
    if (!loading || !streamingText) return null;
    return (
      <div className="flex items-start gap-3 max-w-[80%] flex-row self-start">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 border border-[var(--border-color)] bg-[rgba(20,184,166,0.1)] text-[var(--accent-secondary)]">
          <Bot size={14} />
        </div>
        <div className="px-[1.15rem] py-[0.85rem] shadow-sm bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-[4px_16px_16px_16px]">
          <div>{parseMarkdown(streamingText)}</div>
          <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6 items-stretch h-[calc(100vh-var(--header-height)-4.5rem)]">
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full p-6 bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => { loadContext(); setShowContext(!showContext); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showContext ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Info size={12} /> Context
              </div>
            </button>
          </div>
          <div className="flex gap-2">
            <select
              onChange={(e) => { if (e.target.value) handleGenerateReport(e.target.value); e.target.value = ''; }}
              className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none outline-none"
              defaultValue=""
            >
              <option value="" disabled>Quick Report</option>
              {REPORT_TYPES.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Context Panel */}
        <AnimatePresence>
          {showContext && context && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                  <Info size={14} /> System Context
                </div>
                {context.devices && <p><strong>Devices:</strong> {context.devices.length} connected</p>}
                {context.devices && context.devices.filter(d => d.status === 'On').length > 0 && (
                  <p><strong>Active:</strong> {context.devices.filter(d => d.status === 'On').length} devices running</p>
                )}
                {context.recentNotifications && (
                  <p><strong>Notifications:</strong> {context.recentNotifications.length} recent</p>
                )}
                {context.energyToday !== undefined && (
                  <p><strong>Energy Today:</strong> {typeof context.energyToday === 'number' ? context.energyToday.toFixed(2) : context.energyToday} kWh</p>
                )}
                {context.activeAlerts && context.activeAlerts > 0 && (
                  <p className="text-red-600 dark:text-red-400"><strong>Alerts:</strong> {context.activeAlerts} active</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-[6px] mb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={index}
                  className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse self-end' : 'flex-row self-start'}`}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 border border-[var(--border-color)] ${
                    isUser ? 'bg-[var(--accent-primary)] text-white' : msg.isError ? 'bg-[var(--accent-danger)] text-white' : 'bg-[rgba(20,184,166,0.1)] text-[var(--accent-secondary)]'
                  }`}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`px-[1.15rem] py-[0.85rem] shadow-sm ${
                    isUser
                      ? 'bg-[var(--accent-primary)] border border-[var(--accent-primary)] rounded-[16px_4px_16px_16px]'
                      : msg.isError
                        ? 'bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] rounded-[4px_16px_16px_16px]'
                        : 'bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-[4px_16px_16px_16px]'
                  }`}>
                    {isUser ? (
                      <span className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-[var(--text-primary)]'}`}>{msg.text}</span>
                    ) : (
                      <div>{parseMarkdown(msg.text)}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && streamingText && renderStreamingBubble()}

          {loading && !streamingText && (
            <div className="flex items-start gap-3 max-w-[80%] flex-row self-start">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 border border-[var(--border-color)] bg-[rgba(20,184,166,0.1)] text-[var(--accent-secondary)]">
                <Bot size={14} />
              </div>
              <div className="px-[1.15rem] py-[0.85rem] shadow-sm bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-[4px_16px_16px_16px]">
                <div className="typing-indicator flex items-center gap-[5px] py-[5px]">
                  <div className="typing-dot w-[6px] h-[6px] bg-[var(--text-secondary)] rounded-full" />
                  <div className="typing-dot w-[6px] h-[6px] bg-[var(--text-secondary)] rounded-full" />
                  <div className="typing-dot w-[6px] h-[6px] bg-[var(--text-secondary)] rounded-full" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Sample Prompts */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <motion.div
              key={idx}
              variants={reducedMotion ? {} : chipHover}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="inline-block"
            >
              <button
                className="text-[0.775rem] px-[0.85rem] py-[0.4rem] rounded-lg bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-bold border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200 flex items-center gap-2"
                onClick={() => handleSendMessage(prompt.text)}
                disabled={loading}
              >
                {prompt.icon}
                {prompt.text}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 items-center bg-gray-100 dark:bg-[var(--bg-input)] border border-[var(--border-color)] py-[0.4rem] pr-[0.5rem] pl-4 rounded-xl">
          <input
            type="text"
            className="input-control border-none bg-transparent flex-1 outline-none text-[var(--text-primary)]"
            placeholder={t('aiChat.inputPlaceholder')}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
          />
          <VoiceInput onResult={(text) => setInputMessage(prev => prev + ' ' + text)} />
          <button
            className="w-9 h-9 p-0 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white flex items-center justify-center shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || loading}
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Sidebar - Routines */}
      <div className="w-[290px] px-6 py-5 flex flex-col h-full bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl">
        <div className="flex items-center gap-2 mb-2 border-b border-[var(--border-color)] pb-2">
          <Brain className="text-[var(--accent-secondary)]" size={20} />
          <h3 className="m-0 text-base text-[var(--text-primary)]">{t('aiChat.learnedRoutines')}</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4 leading-[1.4]">
          {t('aiChat.routinesDesc')}
        </p>
        <div className="flex-1 overflow-y-auto flex flex-col gap-[0.85rem] pr-[2px]">
          {routinesLoading ? (
            <div className="flex flex-col gap-3 pt-2">
              <Skeleton width="100%" height="60px" borderRadius="10px" />
              <Skeleton width="100%" height="60px" borderRadius="10px" />
              <Skeleton width="70%" height="60px" borderRadius="10px" />
            </div>
          ) : routines.length > 0 ? (
            routines.map((r, i) => (
              <div key={i} className="bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 flex flex-col gap-1">
                <strong className="text-[0.8rem] text-[var(--text-primary)]">{r.ruleName || t('aiChat.automatedRoutine')}</strong>
                <span className="text-xs text-[var(--text-secondary)] leading-[1.3]">
                  If {r.triggerType} ({r.triggerValue}) &rarr; {r.action}
                </span>
                <div className="mt-1">
                  <span className="badge badge-info text-[0.6rem]">{t('aiChat.confidenceHigh')}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)] text-xs">
              <span>{t('aiChat.noRoutines')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const injectAnimations = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'chat-animations-styles-v3';
  if (document.getElementById(styleId)) return;
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.innerHTML = `
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }
    .typing-dot:nth-child(1) { animation: bounce 1.3s linear infinite; animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation: bounce 1.3s linear infinite; animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation: bounce 1.3s linear infinite; animation-delay: 0.3s; }
    @media (max-width: 900px) {
      .app-content > div:nth-child(1) {
        flex-direction: column !important;
        height: auto !important;
      }
      .app-content > div:nth-child(1) > div:nth-child(2) {
        width: 100% !important;
        margin-top: 1.5rem;
        height: auto !important;
      }
      .messagesFeed { max-height: 400px !important; }
    }
  `;
  document.head.appendChild(styleElement);
};
injectAnimations();

export default AIChat;
