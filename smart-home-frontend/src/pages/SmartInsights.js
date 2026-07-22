import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { aiExplainabilityService, deviceService, automationRuleService, notificationService } from '../services/api';
import Skeleton from '../components/Skeleton';
import { motion } from 'framer-motion';
import useReducedMotion from '../utils/useReducedMotion';
import {
  Brain,
  Send,
  Bot,
  User,
  History,
  Trash2,
  Plus,
  Lightbulb,
  ArrowRight,
  Zap
} from 'lucide-react';
import { formatInline, parseMarkdown } from '../utils/markdownHelpers';

const SmartInsights = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [sessionQueries, setSessionQueries] = useState([]);

  // Fetch live elements to construct suggestions dynamically
  useEffect(() => {
    const generateDynamicSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        const [devices, rules, notifications] = await Promise.all([
          deviceService.getDevices().catch(() => []),
          automationRuleService.getAutomationRules().catch(() => []),
          notificationService.getNotifications().catch(() => [])
        ]);

        const list = [];

        // 1. Energy suggestion
        const highestConsuming = devices.length > 0
          ? [...devices].sort((a, b) => b.powerConsumption - a.powerConsumption)[0]
          : null;
        if (highestConsuming) {
          list.push({
            title: `Highest power device`,
            text: `Explain why the ${highestConsuming.name} in the ${highestConsuming.roomName || 'home'} is consuming the most power.`,
            icon: <Zap className="text-[var(--accent-warning)]" size={16} />
          });
        }

        // 2. Automation suggestion
        const activeRule = rules.length > 0 ? rules.find(r => r.isActive) || rules[0] : null;
        if (activeRule) {
          list.push({
            title: `Explain rule execution`,
            text: `Why did the automation rule '${activeRule.ruleName}' execute?`,
            icon: <Bot className="text-[var(--accent-primary)]" size={16} />
          });
        }

        // 3. Notification suggestion
        const recentNotif = notifications.length > 0 ? notifications[0] : null;
        if (recentNotif) {
          list.push({
            title: `Explain recent notification`,
            text: `Explain why I received the notification: "${recentNotif.title}"`,
            icon: <History className="text-[var(--accent-secondary)]" size={16} />
          });
        }

        // 4. Room electricity suggestion
        if (devices.length > 0) {
          list.push({
            title: `Room consumption`,
            text: `Which room is consuming the most electricity right now?`,
            icon: <Lightbulb className="text-[var(--accent-success)]" size={16} />
          });
        }

        // 5. Default/general dynamically adjusted questions
        list.push({
          title: `Energy saving tips`,
          text: `Provide tips to reduce my home electricity bill based on current devices.`,
          icon: <Lightbulb className="text-[var(--accent-success)]" size={16} />
        });

        list.push({
          title: `Home health score`,
          text: `Why is my Home Health Score low or how is it calculated?`,
          icon: <Brain className="text-[var(--accent-primary)]" size={16} />
        });

        setSuggestions(list.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dynamic suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    generateDynamicSuggestions();
  }, []);

  // Auto-scroll to bottom of chat feed
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [messages, loading, reducedMotion]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'User',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    if (!sessionQueries.includes(textToSend)) {
      setSessionQueries(prev => [textToSend, ...prev].slice(0, 8));
    }

    try {
      const data = await aiExplainabilityService.query(textToSend);

      const assistantMsg = {
        role: 'Assistant',
        text: data.response || t('smartInsights.noResponse', 'No response received.'),
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'Assistant',
        text: t('smartInsights.offlineError', 'Error: The explainability engine is temporarily offline. Please try again later.'),
        isError: true,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      setLoading(true);
      await aiExplainabilityService.clearHistory();
      setMessages([]);
      setSessionQueries([]);
    } catch (err) {
      console.error('Failed to clear explainability history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="sr-only">Smart Insights</h1>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <Brain className="text-[var(--accent-primary)]" size={28} />
          Smart Insights
        </h1>
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
          Factual Home Explainability AI — Ask questions about your devices, energy, automation, and more.
        </p>
      </div>

      <div className="flex gap-6 items-stretch h-[calc(100vh-var(--header-height)-9rem)]">
        {/* Sidebar showing conversation memory logs */}
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="w-[260px] p-5 flex flex-col h-full bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl shadow-sm shrink-0"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-[var(--border-color)]">
            <History className="text-[var(--accent-primary)]" size={18} />
            <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">{t('smartInsights.sessionHistory', 'Session History')}</h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
            {t('smartInsights.sessionDescription', 'Recent insights queried during this session.')}
          </p>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {sessionQueries.length > 0 ? (
              sessionQueries.map((q, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  disabled={loading}
                  className="bg-transparent border border-transparent rounded-lg px-3 py-2.5 flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer w-full outline-none transition-all duration-200 hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex-1 text-left truncate">{q}</span>
                  <ArrowRight className="shrink-0 opacity-50" size={10} />
                </motion.button>
              ))
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                {t('smartInsights.noQueries', 'No queries this session')}
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-[var(--border-color)]">
            <button
              onClick={handleClearHistory}
              disabled={loading}
              className="w-full h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Clear History
            </button>
          </div>
        </motion.div>

        {/* Main chat interface Card */}
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="flex-1 flex flex-col h-full p-6 bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl shadow-sm min-w-0"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100 dark:border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center bg-[var(--accent-primary)]/10">
                <Brain className="text-[var(--accent-primary)]" size={20} />
              </div>
              <div>
                <h2 className="m-0 text-lg font-bold text-[var(--accent-primary)]">Smart Insights</h2>
                <span className="text-xs text-[var(--text-secondary)]">Factual Home Explainability AI</span>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200 flex items-center gap-1.5"
              >
                <Plus size={12} />
                New Chat
              </button>
            )}
          </div>

          {/* Message feed / Initial suggestions grid */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1.5 mb-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 px-4 mx-auto max-w-[650px]">
                <div className="text-5xl text-[var(--accent-primary)] opacity-85">
                  <Brain size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-4 mb-2">How can I explain your Smart Home?</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-[480px] mx-auto mb-8 leading-relaxed">
                  Ask questions about devices, energy logs, anomalies, automation rules, or active alerts. The AI answers truthfully based solely on actual database records.
                </p>

                {/* Suggestions grid */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {suggestionsLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-3 flex flex-col h-[75px]">
                        <Skeleton width="40%" height="14px" />
                        <Skeleton width="90%" height="12px" className="mt-2" />
                      </div>
                    ))
                  ) : (
                    suggestions.map((s, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handleSendMessage(s.text)}
                        className="bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-3 text-left cursor-pointer outline-none transition-all duration-200 flex flex-col items-start w-full"
                        whileHover={{ scale: 1.01, borderColor: 'var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.01)' }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {s.icon}
                          <strong className="text-xs font-bold text-[var(--text-primary)]">{s.title}</strong>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] leading-relaxed text-left">{s.text}</span>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'User';
                return (
                  <div
                    key={index}
                    className={`flex ${isUser ? 'flex-row-reverse self-end' : 'flex-row self-start'} items-start gap-3 max-w-[85%]`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 border border-gray-100 dark:border-[var(--border-color)] ${
                      isUser
                        ? 'bg-[var(--accent-primary)] text-white'
                        : msg.isError
                          ? 'bg-red-500 text-white'
                          : 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                    }`}>
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`p-3 flex flex-col shadow-sm ${
                      isUser
                        ? 'rounded-[16px_4px_16px_16px] bg-[var(--accent-primary)] border border-[var(--accent-primary)]'
                        : msg.isError
                          ? 'rounded-[4px_16px_16px_16px] bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/15'
                          : 'rounded-[4px_16px_16px_16px] bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)]'
                    }`}>
                      <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                        {isUser ? msg.text : parseMarkdown(msg.text)}
                      </div>
                      <span className={`text-[11px] self-end mt-1 ${isUser ? 'text-white/70' : 'text-[var(--text-secondary)]'}`}>{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex flex-row items-start gap-3 max-w-[85%] self-start">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 border border-gray-100 dark:border-[var(--border-color)] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]">
                  <Bot size={14} />
                </div>
                <div className="rounded-[4px_16px_16px_16px] bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] p-3 flex flex-col shadow-sm">
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-[bounce_1.3s_linear_infinite]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-[bounce_1.3s_linear_infinite]"
                      style={{ animationDelay: '0.15s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-[bounce_1.3s_linear_infinite]"
                      style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input area */}
          <div className="flex gap-3 bg-gray-100 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] py-1.5 pr-2 pl-5 rounded-xl items-center">
            <input
              type="text"
              className="h-10 bg-transparent border-none text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none flex-1"
              placeholder="Ask anything about your home (e.g. Why is my energy usage high?)..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="w-9 h-9 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white flex items-center justify-center disabled:opacity-50 transition-all duration-200"
            >
              <Send size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// CSS animations injection
const injectAnimations = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'insights-animations-styles';
  if (document.getElementById(styleId)) return;

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.innerHTML = `
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    @media (max-width: 900px) {
      .app-content > div:nth-child(1) {
        flex-direction: column !important;
        height: auto !important;
      }
      .app-content > div:nth-child(1) > div:nth-child(1) {
        width: 100% !important;
        height: auto !important;
      }
    }
  `;
  document.head.appendChild(styleElement);
};
injectAnimations();

export default SmartInsights;
