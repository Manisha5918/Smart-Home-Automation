import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 animate-fade-in">
      <div className="bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 shadow-sm text-center max-w-lg">
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--accent-primary)]/5 flex items-center justify-center mb-6">
          <SearchX className="text-[var(--accent-primary)]" size={36} />
        </div>
        <h1 className="text-6xl font-black text-[var(--text-primary)] mb-2">404</h1>
        <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">{t('notFound.title') || 'Page Not Found'}</p>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          {t('notFound.description') || 'The page you are looking for does not exist or has been moved.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            <Home size={14} /> {t('notFound.goHome') || 'Go Home'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft size={14} /> {t('notFound.goBack') || 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
