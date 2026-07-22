import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentLanguage = i18n.language || 'en';

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'hi', name: 'हिन्दी' }
  ];

  const isSupported = languages.some((lang) => lang.code === currentLanguage);
  const activeLanguage = isSupported ? currentLanguage : 'en';

  const selectedLangName = languages.find((lang) => lang.code === activeLanguage)?.name || 'English';

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('homemind_language', code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block select-none" style={{ zIndex: 999 }}>
      {/* Dropdown Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0 0.85rem',
          height: '40px',
          width: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          boxSizing: 'border-box',
          transition: 'all var(--transition-normal)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }
        }}
      >
        <span>{selectedLangName}</span>
        <FaChevronDown 
          size={10} 
          style={{ 
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease'
          }} 
        />
      </div>

      {/* Options Dropdown Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            right: 0,
            width: '130px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: 'var(--card-shadow)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxSizing: 'border-box',
            zIndex: 1000
          }}
        >
          {languages.map((lang) => {
            const isActive = lang.code === activeLanguage;
            return (
              <div
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(15, 82, 60, 0.1)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
              >
                {lang.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;