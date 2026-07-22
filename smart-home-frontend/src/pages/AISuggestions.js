import React, { useState, useEffect } from 'react';
import { aiSuggestionService } from '../services/api';
import Skeleton from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  RefreshCw,
  Check,
  Zap,
  ArrowRight,
  Clock,
  SlidersHorizontal
} from 'lucide-react';

const AISuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const { t } = useTranslation();

  const loadSuggestions = async () => {
    try {
      const data = await aiSuggestionService.getSuggestions();
      setSuggestions(data);
    } catch (err) {
      const realError = err.response?.data?.message || err.message || t('aiSuggestions.fetchFailed');
      console.error('Failed to load AI suggestions:', realError);
      toast.error(realError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    toast.loading(t('aiSuggestions.analysisStarted'), { id: 'ai-scan' });
    try {
      const res = await aiSuggestionService.generateSuggestions();
      toast.success(res.message || t('aiSuggestions.recommendationsRefreshed'), { id: 'ai-scan' });
      loadSuggestions();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('aiSuggestions.modelBusy'), { id: 'ai-scan' });
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = async (id) => {
    setActioningId(id);
    try {
      await aiSuggestionService.acceptSuggestion(id);
      toast.success(t('aiSuggestions.recommendationAccepted'));
      loadSuggestions();
    } catch (err) {
      toast.error(err.response?.data?.message || t('aiSuggestions.acceptFailed'));
    } finally {
      setActioningId(null);
    }
  };

  const getTriggerIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'power': return <Zap size={14} />;
      case 'time': return <Clock size={14} />;
      default: return <SlidersHorizontal size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton width="200px" height="32px" />
            <Skeleton width="40%" height="16px" />
          </div>
          <Skeleton width="180px" height="40px" borderRadius="10px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm h-[280px]">
              <div className="flex gap-4 mb-4">
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <Skeleton width="40%" height="20px" />
              </div>
              <Skeleton width="90%" height="50px" className="mb-6" />
              <Skeleton width="100%" height="60px" className="mb-6" />
              <Skeleton width="100%" height="40px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="sr-only">AI Suggestions</h1>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Brain className="text-[var(--accent-primary)]" size={28} />
            {t('aiSuggestions.title')}
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            {t('aiSuggestions.description')}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {generating ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {t('aiSuggestions.scanOptimizations')}
        </button>
      </div>

      {/* Grid List */}
      <AnimatePresence mode="popLayout">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestions.map(suggestion => {
            const isApplied = suggestion.isAccepted;

            return (
              <motion.div
                layout
                key={suggestion.suggestionId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`bg-white dark:bg-[var(--bg-card)] rounded-xl p-5 shadow-sm flex flex-col gap-5 relative overflow-hidden ${
                    isApplied
                      ? 'border border-[var(--accent-success)]/20 border-l-4 border-l-[var(--accent-success)]'
                      : 'border border-gray-100 dark:border-[var(--border-color)] border-l-4 border-l-[var(--accent-primary)]'
                  }`}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Decorative AI Vector Gradient inside Card */}
                  <div
                    className="absolute top-0 right-0 w-[100px] h-[100px] pointer-events-none bg-[radial-gradient(circle_at_100%_0%,var(--grad-bg),transparent)]"
                    style={{ '--grad-bg': isApplied ? 'rgba(16, 185, 129, 0.04)' : 'rgba(59, 130, 246, 0.05)' }}
                  />

                  <div className="flex items-center gap-4 relative z-[2]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      isApplied
                        ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
                        : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    }`}>
                      <Brain size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-[var(--text-primary)] m-0 truncate">{suggestion.title || t('aiSuggestions.suggestionDefault')}</h3>
                      <span className="text-xs text-[var(--text-secondary)] mt-0.5 block">
                        {t('aiSuggestions.detected', { date: new Date(suggestion.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        }) })}
                      </span>
                    </div>
                    {isApplied && (
                      <span className="text-xs font-bold text-[var(--accent-success)] bg-[var(--accent-success)]/10 px-2.5 py-1 rounded-lg self-start shrink-0">
                        {t('aiSuggestions.applied')}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0 relative z-[2]">
                    {suggestion.message}
                  </p>

                  <div className="bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-3 flex items-center gap-3 relative z-[2]">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1">
                        {getTriggerIcon(suggestion.triggerType)} {t('aiSuggestions.ifTrigger')}
                      </span>
                      <span className="text-xs text-[var(--text-primary)]">
                        {suggestion.triggerType === 'Power' && t('aiSuggestions.powerUsage', { value: suggestion.triggerValue })}
                        {suggestion.triggerType === 'Status' && t('aiSuggestions.stateChangesTo', { value: suggestion.triggerValue })}
                        {suggestion.triggerType === 'Time' && t('aiSuggestions.clockReaches', { value: suggestion.triggerValue })}
                      </span>
                    </div>

                    <div className="text-[var(--accent-primary)] shrink-0">
                      <ArrowRight size={14} />
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">{t('aiSuggestions.thenExecute')}</span>
                      <span className="text-xs text-[var(--text-primary)]">
                        {t('aiSuggestions.turnDevice', { state: suggestion.action === 'TurnOn' ? 'On' : 'Off' })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto relative z-[2]">
                    <button
                      disabled={isApplied || actioningId === suggestion.suggestionId}
                      onClick={() => handleAccept(suggestion.suggestionId)}
                      className={`w-full h-10 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        isApplied
                          ? 'bg-gray-50 dark:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-gray-100 dark:border-[var(--border-color)]'
                          : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-sm'
                      } disabled:opacity-50`}
                    >
                      {actioningId === suggestion.suggestionId ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isApplied ? (
                        <><Check size={14} /> {t('aiSuggestions.suggestionActivated')}</>
                      ) : (
                        t('aiSuggestions.acceptLink')
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {suggestions.length === 0 && (
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-8 text-center shadow-sm"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Brain className="mx-auto text-[var(--accent-primary)] opacity-30 mb-5" size={56} />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('aiSuggestions.noRecommendations')}</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-[450px] mx-auto my-1 leading-relaxed">
            {t('aiSuggestions.noRecommendationsDesc')}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm mx-auto disabled:opacity-50"
          >
            {generating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t('aiSuggestions.triggerScan')
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AISuggestions;
