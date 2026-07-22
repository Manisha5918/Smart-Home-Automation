import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Plug,
  Lock,
  Save,
  Key
} from 'lucide-react';

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { register: registerInfo, handleSubmit: handleInfoSubmit, reset: resetInfo, formState: { errors: infoErrors } } = useForm();
  const { register: registerPass, handleSubmit: handlePassSubmit, watch, reset: resetPass, formState: { errors: passErrors } } = useForm();

  const newPasswordVal = watch('newPassword');

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      resetInfo({
        fullName: data.fullName,
        email: data.email
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error(t('profile.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUpdateProfile = async (data) => {
    setSavingProfile(true);
    try {
      const res = await profileService.updateProfile({
        fullName: data.fullName.trim(),
        email: data.email.trim()
      });

      const updatedUser = {
        ...user,
        fullName: res.fullName,
        email: res.email
      };
      setUser(updatedUser);
      toast.success(t('profile.profileUpdated'));
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.profileUpdateFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword === data.currentPassword) {
      toast.error(t('profile.passwordSame'));
      return;
    }

    setSavingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success(t('profile.passwordChanged'));
      resetPass({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.passwordChangeFailed'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[900px] mx-auto">
        <Skeleton width="180px" height="32px" />
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm">
          <div className="flex gap-8 flex-wrap">
            <Skeleton width="80px" height="80px" borderRadius="50%" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton width="40%" height="24px" />
              <Skeleton width="20%" height="16px" />
              <Skeleton width="60%" height="16px" />
            </div>
            <Skeleton width="200px" height="80px" borderRadius="12px" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm">
            <Skeleton width="40%" height="24px" />
            <div className="mt-6 space-y-4">
              <Skeleton width="100%" height="45px" />
              <Skeleton width="100%" height="45px" />
            </div>
          </div>
          <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm">
            <Skeleton width="45%" height="24px" />
            <div className="mt-6 space-y-4">
              <Skeleton width="100%" height="45px" />
              <Skeleton width="100%" height="45px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="sr-only">Profile</h1>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('navigation.profile', 'Profile')}</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">{t('profile.manageAccount', 'Manage your account settings and security')}</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-8 flex-wrap">
          {/* Avatar */}
          <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-[2.15rem] font-extrabold flex items-center justify-center shadow-[0_4px_15px_rgba(59,130,246,0.25)]">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Overview */}
          <div className="flex-1 min-w-[220px] flex flex-col">
            <h2 className="text-2xl font-bold text-[var(--accent-primary)] mb-1">{profile.fullName}</h2>
            <span className="badge badge-info self-start mb-3">{t('profile.system', { role: profile.role })}</span>
            <div className="flex gap-6 flex-wrap">
              <span className="flex items-center text-[var(--text-secondary)] text-sm">
                <Mail size={14} className="mr-2 text-[var(--text-muted)]" />
                {profile.email}
              </span>
              <span className="flex items-center text-[var(--text-secondary)] text-sm">
                <Calendar size={14} className="mr-2 text-[var(--text-muted)]" />
                {t('profile.registered', { date: new Date(profile.createdAt).toLocaleDateString() })}
              </span>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="flex flex-col gap-2 min-w-[180px] bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-[0.85rem_1.25rem]">
            <div className="flex items-center gap-3">
              <Plug size={18} className="text-[var(--accent-primary)]" />
              <div className="flex flex-col text-sm">
                <strong className="text-[var(--text-primary)]">{profile.totalDevices}</strong>
                <span className="text-xs font-medium text-[var(--text-muted)]">{t('profile.smartDevices')}</span>
              </div>
            </div>
            <div className="h-px bg-gray-100 dark:bg-[var(--border-color)]" />
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-[var(--accent-success)]" />
              <div className="flex flex-col text-sm">
                <strong className="text-[var(--text-primary)]">{profile.activeDevices}</strong>
                <span className="text-xs font-medium text-[var(--text-muted)]">{t('profile.activeItems')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Account Info Card */}
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-[var(--border-color)] pb-3">
            <User size={18} className="text-[var(--accent-secondary)]" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">{t('profile.accountInfo')}</h3>
          </div>

          <form onSubmit={handleInfoSubmit(onUpdateProfile)} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{t('profile.fullName')}</label>
                <input
                  type="text"
                  className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                  disabled={savingProfile}
                  {...registerInfo('fullName', { required: t('profile.fullNameRequired') })}
                />
                {infoErrors.fullName && <p className="text-xs text-[var(--accent-danger)] mt-1">{infoErrors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{t('profile.emailAddress')}</label>
                <input
                  type="email"
                  className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                  disabled={savingProfile}
                  {...registerInfo('email', {
                    required: t('profile.emailRequired'),
                    pattern: { value: /^\S+@\S+$/i, message: t('profile.emailInvalid') }
                  })}
                />
                {infoErrors.email && <p className="text-xs text-[var(--accent-danger)] mt-1">{infoErrors.email.message}</p>}
              </div>
            </div>

            <div className="mt-auto pt-5">
              <button
                type="submit"
                className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm w-full justify-center"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    {t('profile.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-[var(--border-color)] pb-3">
            <Key size={18} className="text-[var(--accent-danger)]" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">{t('profile.securitySettings')}</h3>
          </div>

          <form onSubmit={handlePassSubmit(onChangePassword)} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{t('profile.currentPassword')}</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-[var(--text-secondary)]" />
                  <input
                    type="password"
                    className="h-10 pl-10 pr-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                    placeholder={t('profile.passwordPlaceholder')}
                    disabled={savingPassword}
                    {...registerPass('currentPassword', { required: t('profile.currentPasswordRequired') })}
                  />
                </div>
                {passErrors.currentPassword && <p className="text-xs text-[var(--accent-danger)] mt-1">{passErrors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{t('profile.newPassword')}</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-[var(--text-secondary)]" />
                  <input
                    type="password"
                    className="h-10 pl-10 pr-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                    placeholder={t('profile.minCharacters')}
                    disabled={savingPassword}
                    {...registerPass('newPassword', {
                      required: t('profile.newPasswordRequired'),
                      minLength: { value: 6, message: t('profile.passwordMinLength') }
                    })}
                  />
                </div>
                {passErrors.newPassword && <p className="text-xs text-[var(--accent-danger)] mt-1">{passErrors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{t('profile.confirmPassword')}</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-[var(--text-secondary)]" />
                  <input
                    type="password"
                    className="h-10 pl-10 pr-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                    placeholder={t('profile.passwordPlaceholder', '••••••••')}
                    disabled={savingPassword}
                    {...registerPass('confirmPassword', {
                      required: t('profile.confirmRequired'),
                      validate: val => val === newPasswordVal || t('profile.passwordsDoNotMatch')
                    })}
                  />
                </div>
                {passErrors.confirmPassword && <p className="text-xs text-[var(--accent-danger)] mt-1">{passErrors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="mt-auto pt-5">
              <button
                type="submit"
                className="h-10 px-5 bg-[var(--accent-danger)] hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm w-full justify-center"
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Key size={16} />
                    {t('profile.updatePassword')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
