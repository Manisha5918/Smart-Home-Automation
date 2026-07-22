import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import useReducedMotion from '../utils/useReducedMotion';

import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight,
  ShieldCheck, Check, Shield, Globe, Sun, Moon,
  Home, Mic, Thermometer, LockKeyhole, Wifi,
} from 'lucide-react';

import BackgroundLayer from '../components/login/BackgroundLayer';

import OnboardingWalkthrough from '../components/login/OnboardingWalkthrough';
import { supportedLanguages } from '../i18n/i18n';

const LANGUAGE_MAP = {
  en: { code: 'en', name: 'English' },
  hi: { code: 'hi', name: 'हिन्दी' },
  ta: { code: 'ta', name: 'தமிழ்' },
  ml: { code: 'ml', name: 'മലയാളം' },
};

const DEFAULT_LANGUAGES = supportedLanguages
  .filter(code => LANGUAGE_MAP[code])
  .map(code => LANGUAGE_MAP[code]);

const Login = ({ languages: languageOverrides }) => {
  const { login, register: registerUser } = useAuth();
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [rememberMe, setRememberMe] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [shineKey, setShineKey] = useState(0);
  const [rippleStyle, setRippleStyle] = useState({});

  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('app-theme') === 'dark');

  const toggleThemeGlobal = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('app-theme', nextMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextMode);
    document.body.className = nextMode ? 'theme-dark dark' : 'theme-light';
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.className = darkMode ? 'theme-dark dark' : 'theme-light';
  }, [darkMode]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => setShineKey(k => k + 1), 4000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const languages = languageOverrides || DEFAULT_LANGUAGES;
  const activeLanguage = i18n.language || 'en';

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (formData) => {
    setErrorMsg('');
    setJustRegistered(false);
    setLoading(true);
    try {
      if (isRegistering) {
        const regData = await registerUser(formData.fullName, formData.email, formData.password);
        toast.success(t('auth.registerSuccess') || 'Account created!');
        setIsRegistering(false);
        setJustRegistered(true);
        setErrorMsg(regData?.message || 'Registration initiated. Please check your email.');
        reset();
      } else {
        const userData = await login(formData.email, formData.password, rememberMe);
        toast.success(t('auth.loginSuccess') || 'Sign in successful.');
        navigate(userData?.role === 'Admin' ? '/admin/dashboard' : '/');
      }
    } catch (err) {
      let msg = err.message || t('auth.authFailed') || 'Authentication failed.';
      if (err.needsVerification) { msg = 'Please verify your email.'; setJustRegistered(true); }
      setErrorMsg(msg);
      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  const handleRipple = (e) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRippleStyle({ left: e.clientX - rect.left, top: e.clientY - rect.top, display: true });
    setTimeout(() => setRippleStyle({}), 600);
  };

  const iotIcons = [
    { icon: Mic, label: t('login.iconVoice'), x: '4%', y: '3%', delay: 0, size: 'lg' },
    { icon: Thermometer, label: t('login.iconTemp'), x: '75%', y: '2%', delay: 0.4, size: 'sm' },
    { icon: Shield, label: t('login.iconSecurity'), x: '2%', y: '48%', delay: 0.8, size: 'lg' },
    { icon: LockKeyhole, label: t('login.iconLock'), x: '76%', y: '44%', delay: 1.2, size: 'sm' },
    { icon: Wifi, label: t('login.iconWifi'), x: '44%', y: '0%', delay: 1.6, size: 'lg' },
  ];

  return (
    <div className="h-screen w-full relative overflow-hidden font-manrope select-none bg-gradient-to-br from-[#F8FCFA] via-[#F4FBF7] to-[#EEF8F3]">

      <BackgroundLayer darkMode={darkMode} reducedMotion={reducedMotion} />

      {/* Subtle background glows */}
      <div className="absolute pointer-events-none -left-[8%] -top-[12%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.06)_0%,transparent_55%)] blur-[80px]" />
      <div className="absolute pointer-events-none -right-[5%] -bottom-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.05)_0%,transparent_55%)] blur-[80px]" />
      <div className="absolute pointer-events-none right-[5%] top-[25%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5)_0%,transparent_55%)] blur-[90px]" />

      {/* Top Right Controls */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2.5">
        <motion.button whileHover={reducedMotion ? {} : { scale: 1.05, rotate: 15 }}
          onClick={toggleThemeGlobal}
          className="w-8 h-8 rounded-full bg-white border border-[#E7F5EC] flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all">
          {darkMode ? <Sun size={13} className="text-[#16A34A]" /> : <Moon size={13} className="text-[#475569]" />}
        </motion.button>
        <div className="relative">
          <button onClick={() => setLangOpen(!langOpen)}
            className="h-8 px-2.5 rounded-full bg-white border border-[#E7F5EC] flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-[#475569] shadow-sm hover:shadow-md transition-all">
            <Globe size={12} className="text-[#16A34A]" />
            <span>{languages.find(l => l.code === activeLanguage)?.name || 'English'}</span>
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-1 w-28 rounded-xl border border-[#E7F5EC] bg-white p-1.5 z-50 shadow-lg">
                {languages.map((lang) => (
                  <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold cursor-pointer transition-all ${
                      activeLanguage === lang.code ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#475569] hover:bg-[#F8FCFA]'
                    }`}>
                    <span>{lang.name}</span>
                    {activeLanguage === lang.code && <Check size={10} />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ─── MAIN GRID LAYOUT ─── */}
      <div className="relative z-10 h-full grid grid-cols-1 lg:grid-cols-[58%_42%] overflow-hidden">

        {/* ─── LEFT COLUMN ─── */}
        <div className="h-full overflow-hidden lg:overflow-hidden py-3 lg:py-4 pl-6 lg:pl-12 2xl:pl-16 pr-4 lg:pr-6">
          <div className="h-full flex flex-col justify-center">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center shadow-sm">
                <Home size={16} className="text-white" />
              </div>
              <div>
                <span className="text-[13px] font-[700] tracking-[0.5px] text-[#111827]">{t('login.brandFirst')}</span>
                <span className="text-[13px] font-[700] tracking-[0.5px] text-[#16A34A]"> {t('login.brandSecond')}</span>
                <span className="block text-[8px] font-[500] text-[#64748B] tracking-[1px]">{t('login.tagline')}</span>
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={reducedMotion ? {} : { y: -2 }}
              transition={{ duration: 0.3, delay: 0.06 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E7F5EC] shadow-sm mb-2">
              <ShieldCheck size={10} className="text-[#16A34A]" />
              <span className="text-[9px] font-[600] text-[#475569] tracking-[0.8px]">{t('login.aiPowered')}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-[#CBD5E1]" />
              <span className="text-[9px] font-[600] text-[#475569] tracking-[0.8px]">{t('login.local')}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-[#CBD5E1]" />
              <span className="text-[9px] font-[600] text-[#475569] tracking-[0.8px]">{t('login.private')}</span>
            </motion.div>

            <h1 className="sr-only">Login</h1>
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(36px,3.5vw,60px)] font-[900] tracking-[-1.5px] leading-[1.05] text-[#111827] mb-2 max-w-[540px]">
              {t('login.heroTitle1')}<br />
              <span className="text-[#16A34A]">{t('login.heroTitle2')}</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-[clamp(14px,1.1vw,18px)] font-[500] text-[#475569] leading-[1.5] mb-7 max-w-[520px]">
              {t('login.heroDescription')}
            </motion.p>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative">
              <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.10)_0%,transparent_55%)] blur-[100px]"
                animate={reducedMotion ? {} : { opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

              <div className="relative w-full overflow-hidden rounded-[32px] max-h-[360px] aspect-video border border-white/45 shadow-[0_35px_80px_rgba(15,23,42,.18)]">
                <svg className="absolute inset-0 z-10 w-full h-full pointer-events-none"
                  viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
                  <path d="M 40 30 Q 150 100, 400 160" stroke="rgba(22,163,74,0.12)" strokeWidth="1.2" fill="none" strokeDasharray="4 5" />
                  <path d="M 720 25 Q 550 100, 400 160" stroke="rgba(22,163,74,0.12)" strokeWidth="1.2" fill="none" strokeDasharray="4 5" />
                  <path d="M 50 180 Q 220 190, 400 160" stroke="rgba(22,163,74,0.12)" strokeWidth="1.2" fill="none" strokeDasharray="4 5" />
                  <path d="M 750 170 Q 600 190, 400 160" stroke="rgba(22,163,74,0.12)" strokeWidth="1.2" fill="none" strokeDasharray="4 5" />
                  <path d="M 380 0 Q 390 80, 400 160" stroke="rgba(22,163,74,0.12)" strokeWidth="1.2" fill="none" strokeDasharray="4 5" />
                  <path d="M 400 210 Q 405 190, 400 160" stroke="rgba(22,163,74,0.12)" strokeWidth="1.2" fill="none" strokeDasharray="4 5" />
                </svg>
                <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_45%_55%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
                <img src="/smart_home_hero.png" alt="Smart Home"
                  className="w-full h-full object-cover brightness-[1.07] contrast-[1.04]"
                />
                {iotIcons.map((item, i) => (
                  <motion.div key={i} className="absolute z-20 left-[var(--iot-left)] top-[var(--iot-top)]"
                    style={{ '--iot-left': item.x, '--iot-top': item.y }}
                    initial={{ opacity: 0, scale: 0.8, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}>
                    <motion.div
                      className={`flex items-center gap-2 rounded-full cursor-default ${item.size === 'lg' ? 'px-4 py-2' : 'px-3 py-1.5'} bg-white/96 backdrop-blur-[14px] border border-white/50 shadow-[0_12px_25px_rgba(0,0,0,.12)]`}
                      whileHover={reducedMotion ? {} : { y: -6, scale: 1.04 }}
                      animate={reducedMotion ? {} : { y: [0, -4, 0] }}
                      transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: item.delay }}>
                      <item.icon size={item.size === 'lg' ? 16 : 13} className="text-[#16A34A] shrink-0" />
                      <span className={`font-semibold text-[#1F2937] whitespace-nowrap ${item.size === 'lg' ? 'text-[13px]' : 'text-[11px]'} [text-shadow:0_1px_3px_rgba(255,255,255,0.9)]`}>
                        {item.label}
                      </span>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-[#E7F5EC] shadow-sm mt-1.5">
                <ShieldCheck size={10} className="text-[#16A34A]" />
                <span className="text-[9px] font-[500] text-[#475569]">{t('login.privacyTagline')}</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="h-full overflow-hidden lg:overflow-hidden flex items-center justify-center pr-6 lg:pr-12 2xl:pr-16 py-3 lg:py-4">

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px] bg-white rounded-[32px] p-5 border relative overflow-hidden border-[rgba(22,163,74,0.10)] shadow-[0_25px_80px_rgba(15,23,42,.12),0_10px_30px_rgba(34,197,94,.06)]">

            {!reducedMotion && (
              <motion.div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-white/15 to-transparent bg-[length:200%_200%]"
                animate={{ x: ['-100%', '200%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
            )}

            <div className="relative z-10">
              {/* Logo circle */}
              <motion.div
                animate={reducedMotion ? {} : { scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center mx-auto mb-2 shadow-[0_8px_24px_rgba(22,163,74,0.2)]">
                <Home size={18} className="text-white" />
              </motion.div>

              {/* Welcome */}
              <h2 className="text-[20px] font-[800] text-center text-[#111827] mb-0.5">
                {isRegistering ? t('auth.register') : t('login.welcomeBack')}
              </h2>
              <div className="w-[55px] h-[4px] rounded-full bg-[#16A34A] mx-auto mb-1.5" />
              <p className="text-[11px] font-[500] text-center text-[#64748B] mb-3">
                {isRegistering ? t('auth.registerDescription') : t('login.loginDescription')}
              </p>

              {/* Error messages */}
              {errorMsg && (
                <motion.div className="bg-red-50 border border-red-200 text-red-600 text-[11px] px-3 py-1.5 rounded-[10px] flex items-center gap-2 mb-2" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {justRegistered && !errorMsg && (
                <motion.div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] px-3 py-1.5 rounded-[10px] flex items-center gap-2 mb-2" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                  <ShieldCheck size={11} className="shrink-0" />
                  <span>{t('auth.verifyEmail')}</span>
                </motion.div>
              )}

              {/* Form */}
              <form className="flex flex-col gap-1.5" onSubmit={handleSubmit(onSubmit)}>
                {isRegistering && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div>
                      <label className="text-[11px] font-[600] text-[#475569] mb-1 block">{t('auth.fullName')}</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                        <input {...register('fullName')} type="text" placeholder={t('auth.fullNamePlaceholder')} disabled={loading}
                          className="w-full h-[42px] pl-9 pr-3 text-[13px] font-[500] text-[#111827] bg-[#F8FCFA] border border-[#E7F5EC] rounded-[12px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20 transition-all disabled:opacity-50" />
                      </div>
                      {errors.fullName?.message && <span className="text-[10px] text-red-500 mt-0.5 block">{errors.fullName.message}</span>}
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="text-[11px] font-[600] text-[#475569] mb-1 block">{t('login.emailLabel')}</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                    <input {...register('email')} type="email" placeholder={t('auth.emailPlaceholder')} disabled={loading}
                      className="w-full h-[42px] pl-9 pr-3 text-[13px] font-[500] text-[#111827] bg-[#F8FCFA] border border-[#E7F5EC] rounded-[12px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20 transition-all disabled:opacity-50" />
                  </div>
                  {errors.email?.message && <span className="text-[10px] text-red-500 mt-0.5 block">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="text-[11px] font-[600] text-[#475569] mb-1 block">{t('login.passwordLabel')}</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder={t('auth.passwordPlaceholder')} disabled={loading}
                      className="w-full h-[42px] pl-9 pr-9 text-[13px] font-[500] text-[#111827] bg-[#F8FCFA] border border-[#E7F5EC] rounded-[12px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20 transition-all disabled:opacity-50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password?.message && <span className="text-[10px] text-red-500 mt-0.5 block">{errors.password.message}</span>}
                </div>

                {!isRegistering && (
                  <div className="flex items-center justify-between mt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-[500] text-[#64748B] hover:text-[#111827] transition-colors">
                      <input type="checkbox" className="rounded w-3 h-3 cursor-pointer accent-[#16A34A]" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      <span>{t('auth.rememberDevice')}</span>
                    </label>
                    <Link to="/forgot-password" className="text-[11px] font-[600] text-[#16A34A] hover:text-[#15803D] transition-colors">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                )}

                <div className="mt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={handleRipple}
                    className="relative w-full h-[44px] overflow-hidden rounded-[14px] bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-[700] text-[14px] shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group">
                    <div className="flex items-center justify-center gap-2">
                      <span>{isRegistering ? t('auth.registerButton') : t('auth.signInButton')}</span>
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </span>
                    </div>
                    {loading && (
                      <span className="absolute inset-0 flex items-center justify-center bg-[#16A34A]/80">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2.5">
                <div className="absolute inset-x-0 h-px bg-[#E7F5EC]" />
                <div className="relative z-10 w-5 h-5 rounded-full bg-white border border-[#E7F5EC] flex items-center justify-center">
                  <Shield size={9} className="text-[#16A34A]" />
                </div>
              </div>

              {/* Security Box */}
              <div className="bg-[#F8FCFA] rounded-[10px] p-2 border border-[#E7F5EC] mb-2">
                <div className="flex items-start gap-1.5">
                  <div className="w-7 h-7 rounded-[8px] bg-[#16A34A]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-[#16A34A]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-[700] text-[#111827] mb-0.5">{t('login.securityBoxTitle')}</h4>
                    <p className="text-[10px] font-[500] text-[#64748B] leading-snug">{t('login.securityBoxDescription')}</p>
                  </div>
                </div>
              </div>

              {/* Create account */}
              <div className="text-center mb-1">
                <p className="text-[11px] font-[500] text-[#64748B]">
                  {isRegistering ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                  <button type="button" className="font-[700] text-[#16A34A] hover:text-[#15803D] ml-1 cursor-pointer transition-colors"
                    onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); setJustRegistered(false); reset(); }}>
                    {isRegistering ? t('auth.signInInstead') : t('auth.createAccount')}
                  </button>
                </p>
              </div>

              {/* Explore Features */}
              <div className="pt-1.5 border-t border-[#E7F5EC]">
                <button onClick={() => setOnboardingOpen(true)}
                  className="group w-full flex items-center justify-center gap-2 py-1.5 rounded-[10px] border border-[#E7F5EC] text-[11px] font-[600] text-[#64748B] hover:text-white hover:bg-gradient-to-r hover:from-[#16A34A] hover:to-[#15803D] hover:border-transparent transition-all duration-300 cursor-pointer">
                  <span className="group-hover:translate-x-[-2px] transition-transform duration-300">✨</span>
                  <span>{t('login.exploreDemo')}</span>
                  <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {onboardingOpen && (
        <OnboardingWalkthrough
          onClose={() => setOnboardingOpen(false)}
          setIsRegistering={(val) => { setIsRegistering(val); setOnboardingOpen(false); }}
        />
      )}


    </div>
  );
};

export default Login;
