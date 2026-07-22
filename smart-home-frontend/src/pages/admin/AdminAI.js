import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { aiChatService, adminService } from '../../services/api';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Send, Clock } from 'lucide-react';

const responseCache = new Map();
const LONG_WAIT_MS = 4000;

const AdminAI = () => {
  const { t } = useTranslation();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [waitLong, setWaitLong] = useState(false);

  const chatEndRef = useRef(null);
  const waitTimerRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => () => clearTimeout(waitTimerRef.current), []);

  const [systemContext, setSystemContext] = useState('');

  const fetchContext = useCallback(async () => {
    try {
      const [users, devices, energy] = await Promise.all([
        adminService.getUsers().catch(() => null),
        adminService.getAllDevices().catch(() => null),
        adminService.getEnergyOverview().catch(() => null),
      ]);
      let ctx = '';
      if (users && Array.isArray(users)) {
        ctx += `There are ${users.length} users in the system. `;
      }
      if (devices && Array.isArray(devices)) {
        ctx += `There are ${devices.length} registered devices. `;
      }
      if (energy) {
        ctx += `Total energy consumption: ${energy.totalConsumption ?? energy.total ?? 'N/A'} kWh. `;
      }
      setSystemContext(ctx);
    } catch { /* context unavailable */ }
  }, []);

  useEffect(() => { fetchContext(); }, [fetchContext]);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    setWaitLong(false);

    const cached = responseCache.get(userMsg.toLowerCase());
    if (cached) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { role: 'ai', content: cached }]);
        setChatLoading(false);
      }, 200);
      return;
    }

    waitTimerRef.current = setTimeout(() => setWaitLong(true), LONG_WAIT_MS);

    try {
      const contextualMsg = systemContext
        ? `System context: ${systemContext}\n\nUser question: ${userMsg}`
        : userMsg;
      const result = await aiChatService.chat(contextualMsg);
      clearTimeout(waitTimerRef.current);
      setWaitLong(false);
      const reply = result.response || t('adminAI.aiUnavailable', 'AI service unavailable');
      responseCache.set(userMsg.toLowerCase(), reply);
      setChatMessages(prev => [...prev, { role: 'ai', content: reply }]);
    } catch (err) {
      clearTimeout(waitTimerRef.current);
      setWaitLong(false);
      setChatMessages(prev => [...prev, { role: 'ai', content: t('adminAI.errorPrefix', 'Error: ') + (err.response?.data?.message || err.message || t('adminAI.aiUnavailable', 'AI service unavailable')) }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, systemContext, t]);

  return (
    <div>
      <h1 className="sr-only">Admin AI</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)] mb-1">{t('adminAI.intelligence', 'AI Intelligence')}</p>
        <h2 className="text-2xl font-bold text-[var(--accent-primary)] font-['Outfit']">{t('adminAI.insights', 'AI Insights')}</h2>
      </div>

      <div className="admin-cards-grid">
        <motion.div className="admin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-card-header">
            <h3><MessageSquare size={16} className="mr-1.5" /> {t('adminAI.chat', 'AI Chat')} <span className="text-[var(--text-muted)] font-normal text-[11px]">({chatMessages.length})</span></h3>
            {chatMessages.length > 0 && (
              <button onClick={() => { setChatMessages([]); responseCache.clear(); fetchContext(); }}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer transition-all hover:brightness-110"
              >{t('common.clear', 'Clear')}</button>
            )}
          </div>
          <div className="h-80 overflow-y-auto mb-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)]">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary-dim)] flex items-center justify-center mb-4">
                  <Brain size={28} className="text-[var(--accent-primary)]" />
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{t('adminAI.startConversation', 'Start a conversation with AI')}</p>
                <p className="text-xs mt-1 opacity-60">{t('adminAI.askTopics', 'Ask about energy, devices, or automation')}</p>
                <div className="flex flex-wrap gap-2 mt-5 justify-center">
                  {[
                    { label: 'How many users are registered?', query: 'how many users are registered in the system' },
                    { label: 'List all devices', query: 'list all devices in the smart home' },
                    { label: 'Current energy usage', query: 'what is the current energy consumption overview' },
                  ].map((q, i) => (
                    <button key={i} onClick={() => { setChatInput(q.query); }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] text-[10px] font-bold border-none cursor-pointer transition-all hover:brightness-110"
                    >{q.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent-primary)] text-white rounded-br-md'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border-color)]'
                  } whitespace-pre-wrap break-words`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl rounded-bl-md p-3">
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-ping" />
                    {waitLong ? (
                      <><Clock size={12} className="inline" /> {t('adminAI.stillThinking', 'Still generating...')}</>
                    ) : (
                      t('common.thinking', 'Thinking...')
                    )}
                  </p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !chatLoading && handleSend()}
              placeholder={t('adminAI.chatPlaceholder', 'Ask AI anything...')}
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all"
              disabled={chatLoading}
            />
            <button onClick={handleSend} disabled={!chatInput.trim() || chatLoading}
              className="p-2.5 rounded-xl bg-[var(--accent-primary)] text-white border-none cursor-pointer disabled:opacity-50 transition-all hover:brightness-110"
            ><Send size={16} /></button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAI;
