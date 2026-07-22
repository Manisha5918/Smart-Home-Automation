import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const GlobalHeader = () => {
  const { i18n } = useTranslation();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'gu' ? 'gu-IN' : 'en-US';

  const timeStr = clock.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const dateStr = clock.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex items-center gap-2 mr-2">
      <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">
        🕒 {timeStr}
      </span>
      <span className="w-px h-3 bg-gray-200" />
      <span className="text-xs font-medium text-[#94A3B8] whitespace-nowrap">
        📅 {dateStr}
      </span>
    </div>
  );
};

export default GlobalHeader;
