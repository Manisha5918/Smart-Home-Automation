import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneAlt, FaTimes, FaSpinner, FaVolumeUp } from 'react-icons/fa';
import speechService from '../services/SpeechService';
import { voiceCommandService } from '../services/VoiceCommandService';
import { deviceService, vacationModeService, aiChatService } from '../services/api';
import VoiceCommandResolver from '../services/VoiceCommandResolver';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const STATUS = {
  IDLE: 'idle', LISTENING: 'listening', PROCESSING: 'processing',
  SPEAKING: 'speaking', ERROR: 'error',
};

const ROUTE_KEYWORDS = [
  { keywords: ['dashboard', 'home', 'main'], route: '/', label: 'Dashboard' },
  { keywords: ['device', 'appliance', 'devices'], route: '/devices', label: 'Devices' },
  { keywords: ['room', 'rooms'], route: '/rooms', label: 'Rooms' },
  { keywords: ['notification', 'alert', 'notifications', 'alerts'], route: '/notifications', label: 'Notifications' },
  { keywords: ['vacation', 'away', 'holiday'], route: '/vacation-mode', label: 'Vacation Mode' },
  { keywords: ['automation', 'rule', 'rules', 'automations'], route: '/automation-rules', label: 'Automation Rules' },
  { keywords: ['suggestion', 'recommend', 'suggestions', 'recommendations'], route: '/ai-suggestions', label: 'AI Suggestions' },
  { keywords: ['chat', 'talk', 'converse'], route: '/ai-chat', label: 'AI Chat' },
  { keywords: ['profile', 'setting', 'settings', 'account'], route: '/profile', label: 'Profile' },
  { keywords: ['log', 'logs', 'activity', 'history'], route: '/activity-logs', label: 'Activity Logs' },
  { keywords: ['maintenance', 'repair', 'service'], route: '/maintenance', label: 'Maintenance' },
  { keywords: ['report', 'reports', 'analytics'], route: '/ai-report', label: 'Report' },
  { keywords: ['security', 'secure', 'risk', 'safety'], route: '/security', label: 'Security' },
  { keywords: ['predictive', 'predict', 'health'], route: '/predictive-maintenance', label: 'Predictive Maintenance' },
  { keywords: ['insight', 'explain'], route: '/smart-insights', label: 'Insights' },
  { keywords: ['weather', 'temperature', 'climate'], route: '/weather', label: 'Weather' },
  { keywords: ['energy', 'power', 'electricity'], route: '/ai-report', label: 'Energy' },
  { keywords: ['admin', 'management'], route: '/admin', label: 'Admin' },
];

const VoiceAssistant = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [recognizedText, setRecognizedText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognizedRef = useRef('');
  const isHoldingRef = useRef(false);
  const resolverRef = useRef(new VoiceCommandResolver());

  useEffect(() => {
    deviceService.getDevices().then(res => {
      const list = Array.isArray(res) ? res : res?.data ?? res?.$values ?? [];
      resolverRef.current.setDevices(list);
    }).catch(() => {});
  }, []);

  const getLanguageCode = useCallback(() => {
    const map = { en: 'en-US', ta: 'ta-IN', hi: 'hi-IN', ml: 'ml-IN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);

  const handleResult = useCallback(({ text }) => {
    recognizedRef.current = text;
    setRecognizedText(text);
  }, []);

  const speak = useCallback((text) => {
    speechService.speak(text, { lang: getLanguageCode() }).catch(() => {});
  }, [getLanguageCode]);

  const executeCommand = useCallback((text) => {
    if (!text || !text.trim()) return;
    const lowerText = text.toLowerCase();

    // Quick greetings/time
    if (lowerText === 'hi' || lowerText === 'hello' || lowerText.startsWith('hi ') || lowerText.startsWith('hello ')) {
      const name = user?.fullName || user?.firstName || user?.name || '';
      const msg = name ? t('voiceAssistant.greeting', { name }) : t('voiceAssistant.greetingGeneric');
      setResponseText(msg); speak(msg); setStatus(STATUS.IDLE); return;
    }
    if (lowerText.includes('thank')) {
      const msg = t('voiceAssistant.thanks');
      setResponseText(msg); speak(msg); setStatus(STATUS.IDLE); return;
    }
    if (lowerText.includes('time')) {
      const msg = t('voiceAssistant.time', { time: new Date().toLocaleTimeString().replace(/:\d+ /, ' ') });
      setResponseText(msg); speak(msg); setStatus(STATUS.IDLE); return;
    }

    // Vacation Mode
    if (lowerText.includes('vacation') || lowerText.includes('away')) {
      if (lowerText.includes('enable') || lowerText.includes('on') || lowerText.includes('activate') || lowerText.includes('start')) {
        vacationModeService.enable({}).then(() => {
          setResponseText(t('voiceAssistant.vacationEnabled')); speak(t('voiceAssistant.vacationEnabled'));
        }).catch(() => {
          navigate('/vacation-mode');
          setResponseText(t('voiceAssistant.opening', { page: 'Vacation Mode' })); speak(t('voiceAssistant.opening', { page: 'Vacation Mode' }));
        });
        setStatus(STATUS.IDLE); return;
      }
      if (lowerText.includes('disable') || lowerText.includes('off') || lowerText.includes('deactivate') || lowerText.includes('stop')) {
        vacationModeService.disable().then(() => {
          setResponseText(t('voiceAssistant.vacationDisabled')); speak(t('voiceAssistant.vacationDisabled'));
        }).catch(() => {
          navigate('/vacation-mode');
          setResponseText(t('voiceAssistant.opening', { page: 'Vacation Mode' })); speak(t('voiceAssistant.opening', { page: 'Vacation Mode' }));
        });
        setStatus(STATUS.IDLE); return;
      }
      navigate('/vacation-mode');
      setResponseText(t('voiceAssistant.opening', { page: 'Vacation Mode' })); speak(t('voiceAssistant.opening', { page: 'Vacation Mode' }));
      setStatus(STATUS.IDLE); return;
    }

    // Emergency
    if (lowerText.includes('lockdown') || lowerText.includes('emergency')) {
      navigate('/admin');
      setResponseText(t('voiceAssistant.emergency')); speak(t('voiceAssistant.emergency'));
      setStatus(STATUS.IDLE); return;
    }

    // NLU Device Control via Resolver (run BEFORE navigation so device commands don't get hijacked)
    const result = resolverRef.current.resolve(text);

    if (result.noIntent) {
      const fallbackExamples = [
        "'turn on living room light'",
        "'turn off AC'",
        "'set temperature to 24'",
        "'dim lights to 50%'",
        "'goodnight'",
        "'what is the temperature'",
        "'turn off all lights'",
        "'open dashboard'",
      ];
      setResponseText(t('voiceAssistant.noIntent', { example: fallbackExamples.join(', ') }));
      speak(t('voiceAssistant.noIntent', { example: fallbackExamples.join(', ') }));
      setStatus(STATUS.IDLE); return;
    }

    if (result.needsClarification) {
      const names = resolverRef.current.getCandidateNames(result.candidates);
      const count = resolverRef.current.getCandidateCount(result.candidates);
      if (count > 5) {
        setResponseText(t('voiceAssistant.clarificationWithMore', { list: names.join(', '), count: count - 5 }));
        speak(t('voiceAssistant.clarificationWithMore', { list: names.join(', '), count: count - 5 }));
      } else {
        setResponseText(t('voiceAssistant.clarification', { list: names.join(', ') }));
        speak(t('voiceAssistant.clarification', { list: names.join(', ') }));
      }
      setStatus(STATUS.IDLE); return;
    }

    if (result.success && result.device) {
      const device = result.device;
      const action = result.action;
      const room = result.room || device.roomName || device.room || '';
      const deviceName = device.deviceName || device.name || 'Device';

      setStatus(STATUS.PROCESSING);
      if (room) {
        setResponseText(t('voiceAssistant.executing', { action: action === 'on' ? 'Turning on' : action === 'off' ? 'Turning off' : action, device: deviceName, room }));
      }

      const statusPayload = action === 'on' || action === 'open' ? 'on' : 'off';
      deviceService.updateDeviceStatus(device.id, statusPayload).then(() => {
        let msg;
        if (action === 'on') {
          msg = room ? t('voiceAssistant.deviceTurnedOn', { device: deviceName, room }) : t('voiceAssistant.deviceTurnedOnSimple', { device: deviceName });
        } else if (action === 'off') {
          msg = room ? t('voiceAssistant.deviceTurnedOff', { device: deviceName, room }) : t('voiceAssistant.deviceTurnedOffSimple', { device: deviceName });
        } else if (action === 'open') {
          msg = t('voiceAssistant.deviceOpened', { device: deviceName });
        } else if (action === 'close') {
          msg = t('voiceAssistant.deviceClosed', { device: deviceName });
        } else {
          msg = room ? t('voiceAssistant.deviceTurnedOn', { device: deviceName, room }) : t('voiceAssistant.deviceTurnedOnSimple', { device: deviceName });
        }
        setResponseText(msg);
        speak(msg);
        setStatus(STATUS.IDLE);
      }).catch(() => {
        const msg = t('voiceAssistant.deviceFailed', { action: statusPayload === 'on' ? 'on' : 'off', device: deviceName });
        setResponseText(msg);
        speak(msg);
        setStatus(STATUS.IDLE);
      });
      return;
    }

    // Intent matched but no specific device — handle smart intents
    if (result.action === 'temperature') {
      navigate('/weather');
      setResponseText('Opening weather & environment to check temperature settings.');
      speak('Opening weather and environment to check temperature settings.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'brightness') {
      navigate('/devices');
      setResponseText('Opening devices so you can adjust brightness levels.');
      speak('Opening devices so you can adjust brightness levels.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'speed') {
      navigate('/devices');
      setResponseText('Opening devices to adjust fan speed settings.');
      speak('Opening devices to adjust fan speed settings.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'scene') {
      setResponseText('Scene activated! Your home is now set to the requested mode.');
      speak('Scene activated! Your home is now set to the requested mode.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'query') {
      navigate('/smart-insights');
      setResponseText('Opening Smart Insights to answer your question.');
      speak('Opening Smart Insights to answer your question.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'schedule') {
      navigate('/automation-rules');
      setResponseText('Opening automation rules to set up your schedule.');
      speak('Opening automation rules to set up your schedule.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'all') {
      setResponseText('Processing your request for all devices.');
      speak('Processing your request for all devices.');
      setStatus(STATUS.IDLE); return;
    }

    if (result.action === 'mode') {
      navigate('/automation-rules');
      setResponseText('Opening automation rules to change the mode.');
      speak('Opening automation rules to change the mode.');
      setStatus(STATUS.IDLE); return;
    }

    // Navigation (only when NLU didn't match any device, and command looks like navigation)
    const isNav = lowerText.startsWith('go ') || lowerText.startsWith('open ') || lowerText.startsWith('show ') ||
                  lowerText.includes('navigate') || lowerText.includes('take me') || lowerText.includes('go to');
    const simpleNav = !lowerText.includes('turn') && !lowerText.includes('switch') && !lowerText.includes('toggle') &&
                      (lowerText.split(/\s+/).length <= 3);

    if (isNav || simpleNav) {
      for (const entry of ROUTE_KEYWORDS) {
        if (entry.keywords.some(kw => lowerText.includes(kw))) {
          navigate(entry.route);
          setResponseText(t('voiceAssistant.opening', { page: entry.label })); speak(t('voiceAssistant.opening', { page: entry.label }));
          setStatus(STATUS.IDLE); return;
        }
      }
    }

    // Fallback: backend voice then AI chat
    setStatus(STATUS.PROCESSING);
    voiceCommandService.processVoiceCommand(text).then(resp => {
      if (resp.action === 'navigate' && resp.data?.path) navigate(resp.data.path);
      const msg = resp.spokenResponse || t('voiceAssistant.unknown');
      setResponseText(msg); speak(msg); setStatus(STATUS.IDLE);
    }).catch(() => {
      aiChatService.chat(text).then(resp => {
        const reply = resp?.response || resp?.reply || resp?.message || t('voiceAssistant.unknown');
        setResponseText(reply); speak(reply); setStatus(STATUS.IDLE);
      }).catch(() => {
        setResponseText(t('voiceAssistant.unknown')); speak(t('voiceAssistant.unknown')); setStatus(STATUS.IDLE);
      });
    });
  }, [navigate, user, speak, t]);

  const handleEnd = useCallback(() => {
    const txt = recognizedRef.current;
    if (txt && isHoldingRef.current) {
      isHoldingRef.current = false;
      executeCommand(txt);
    } else {
      isHoldingRef.current = false;
      setStatus(STATUS.IDLE);
    }
  }, [executeCommand]);

  const handleError = useCallback((error) => {
    if (error === 'no-speech') { setStatus(STATUS.IDLE); return; }
    setErrorMessage(error === 'not-allowed' ? t('voiceAssistant.micDenied') : `Error: ${error}`);
    setStatus(STATUS.ERROR);
  }, [t]);

  const startListening = useCallback(() => {
    isHoldingRef.current = true;
    setRecognizedText(''); setResponseText(''); setErrorMessage(''); recognizedRef.current = '';
    setStatus(STATUS.LISTENING);
    speechService.startListening({ onResult: handleResult, onEnd: handleEnd, onError: handleError, language: getLanguageCode() });
  }, [handleResult, handleEnd, handleError, getLanguageCode]);

  const cleanup = useCallback(() => { isHoldingRef.current = false; speechService.stopListening(); }, []);
  const handleMicPointerDown = useCallback(() => startListening(), [startListening]);
  const handleMicPointerUp = useCallback(() => speechService.stopListening(), []);
  const handleMicPointerLeave = useCallback(() => { if (isHoldingRef.current) speechService.stopListening(); }, []);

  const togglePanel = useCallback(() => {
    if (isOpen) { speechService.cancelSpeech(); cleanup(); setStatus(STATUS.IDLE); }
    setIsOpen(p => !p);
  }, [isOpen, cleanup]);

  useEffect(() => () => { speechService.cancelSpeech(); isHoldingRef.current = false; speechService.stopListening(); }, []);

  return (
    <>
      <motion.button
        className="voice-fab"
        onClick={togglePanel}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%', border: 'none',
          background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(31, 122, 90, 0.4)', zIndex: 1000, fontSize: '22px',
        }}
        aria-label="Voice Assistant"
      >
        {status === STATUS.PROCESSING || status === STATUS.SPEAKING ? (
          <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <FaMicrophone />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="voice-panel"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: '92px', right: '24px',
              width: '360px', maxWidth: 'calc(100vw - 48px)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', borderRadius: '20px',
              padding: '24px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)', zIndex: 1000,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px' }}>{t('voiceAssistant.title')}</span>
              <button onClick={togglePanel} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '18px', padding: '4px', opacity: 0.7 }} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {status === STATUS.ERROR && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 8px' }}>{errorMessage}</p>}
              <motion.div
                style={{
                  width: '96px', height: '96px', borderRadius: '50%',
                  background: status === STATUS.LISTENING ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  border: '3px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', cursor: 'pointer',
                  boxShadow: status === STATUS.LISTENING ? '0 0 0 8px rgba(31, 122, 90, 0.2)' : 'none',
                  transition: 'all 0.2s ease', position: 'relative',
                }}
                onPointerDown={handleMicPointerDown}
                onPointerUp={handleMicPointerUp}
                onPointerLeave={handleMicPointerLeave}
                whileTap={{ scale: 0.92 }}
              >
                {status === STATUS.LISTENING && (
                  <motion.div
                    style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {status === STATUS.PROCESSING ? (
                  <FaSpinner style={{ color: 'var(--accent-primary)', fontSize: '32px', animation: 'spin 1s linear infinite' }} />
                ) : status === STATUS.SPEAKING ? (
                  <FaVolumeUp style={{ color: 'var(--accent-primary)', fontSize: '32px' }} />
                ) : (
                  <FaMicrophoneAlt style={{ color: status === STATUS.LISTENING ? '#fff' : 'var(--text-primary)', fontSize: '32px' }} />
                )}
              </motion.div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0' }}>
                {status === STATUS.IDLE && t('voiceAssistant.tapToSpeak')}
                {status === STATUS.LISTENING && t('voiceAssistant.listening')}
                {status === STATUS.PROCESSING && t('voiceAssistant.processing')}
                {status === STATUS.SPEAKING && t('voiceAssistant.speaking')}
                {status === STATUS.ERROR && t('voiceAssistant.error')}
              </p>
            </div>

            {recognizedText && (
              <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('voiceAssistant.youSaid')}</p>
                <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '0' }}>{recognizedText}</p>
              </div>
            )}

            {responseText && (
              <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('voiceAssistant.assistant')}</p>
                <p style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: '0' }}>{responseText}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default VoiceAssistant;
