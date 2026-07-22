import React, { useState, useEffect } from 'react';
import { roomService, deviceService } from '../services/api';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Pencil,
  Trash2,
  DoorOpen,
  Eye,
  Plug,
  X
} from 'lucide-react';

const Rooms = () => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inspect Drawer states
  const [inspectedRoom, setInspectedRoom] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Modal CRUD states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadRooms = async () => {
    try {
      const data = await roomService.getRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      toast.error(t('rooms.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    reset({
      roomName: '',
      description: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    reset({
      roomName: room.roomName,
      description: room.description || ''
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (data) => {
    setSubmitting(true);
    const roomPayload = {
      roomName: data.roomName.trim(),
      description: data.description.trim()
    };

    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.roomId, roomPayload);
        toast.success(t('rooms.modified'));
      } else {
        await roomService.createRoom(roomPayload);
        toast.success(t('rooms.created'));
      }
      setModalOpen(false);
      loadRooms();
      if (inspectedRoom && inspectedRoom.roomId === editingRoom?.roomId) {
        handleInspectRoom(editingRoom.roomId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('rooms.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(t('rooms.deleteConfirm', { name: room.roomName }))) {
      return;
    }
    try {
      await roomService.deleteRoom(room.roomId);
      toast.success(t('rooms.deleted'));
      if (inspectedRoom && inspectedRoom.roomId === room.roomId) {
        setInspectedRoom(null);
      }
      loadRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || t('rooms.deleteFailed'));
    }
  };

  const handleInspectRoom = async (id) => {
    setInspectLoading(true);
    const basicRoom = rooms.find(r => r.roomId === id);
    setInspectedRoom({ roomId: id, roomName: basicRoom?.roomName || 'Room Details', devices: [] });
    try {
      const data = await roomService.getRoomDevices(id);
      setInspectedRoom(data);
    } catch (err) {
      toast.error(t('rooms.inspectFailed'));
    } finally {
      setInspectLoading(false);
    }
  };

  const handleToggleDevice = async (device) => {
    if (!inspectedRoom) return;
    const nextStatus = device.status === 'On' ? 'Off' : 'On';
    try {
      setInspectedRoom(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.deviceId === device.deviceId ? { ...d, status: nextStatus } : d)
      }));
      await deviceService.updateDeviceStatus(device.deviceId, nextStatus);
      toast.success(t('rooms.deviceTurned', { name: device.name, status: nextStatus }));
      loadRooms();
    } catch (err) {
      toast.error(t('rooms.deviceToggleFailed'));
      handleInspectRoom(inspectedRoom.roomId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="150px" height="32px" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm">
              <div className="flex gap-4 mb-4">
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <Skeleton width="50%" height="20px" />
              </div>
              <Skeleton width="90%" height="40px" className="mb-4" />
              <Skeleton width="100%" height="30px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only">Rooms</h1>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('rooms.title')}</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">{t('rooms.organizeDesc')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          {t('rooms.createRoom')}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map(room => (
          <motion.div
            key={room.roomId}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`bg-white dark:bg-[var(--bg-card)] border rounded-xl p-5 shadow-sm ${
              inspectedRoom?.roomId === room.roomId
                ? 'border-[var(--accent-primary)]'
                : 'border-gray-100 dark:border-[var(--border-color)]'
            }`}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-teal-500/10 text-[var(--accent-secondary)]">
                <DoorOpen size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{room.roomName}</h3>
                <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full">
                  {room.deviceCount || 0} {t('rooms.devicesBadge')}
                </span>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6 min-h-[44px]">
              {room.description || t('rooms.noDescription')}
            </p>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-[var(--border-color)]">
              <button
                onClick={() => handleInspectRoom(room.roomId)}
                className="h-9 px-4 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200 flex items-center gap-2"
              >
                <Eye size={14} />
                {t('rooms.inspect')}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => openEditModal(room)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all duration-200 border border-gray-100 dark:border-[var(--border-color)]"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(room)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 border border-gray-100 dark:border-[var(--border-color)]"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {rooms.length === 0 && (
        <motion.div
          className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-12 text-center shadow-sm"
        >
          <p className="text-[var(--text-secondary)]">{t('rooms.noRooms')}</p>
          <button
            onClick={openAddModal}
            className="mt-4 h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200"
          >
            {t('rooms.addFirstRoom')}
          </button>
        </motion.div>
      )}

      {/* Slide-out Inspect Drawer Overlay */}
      <AnimatePresence>
        {inspectedRoom && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedRoom(null)}
            />

            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[380px] max-w-full bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-[-10px_0_30px_rgba(0,0,0,0.04)] z-[1001] p-7 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            >
              <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{inspectedRoom.roomName}</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{t('rooms.applianceListing')}</span>
                </div>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all"
                  onClick={() => setInspectedRoom(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {inspectLoading ? (
                  <div className="flex items-center justify-center h-[200px] flex-col gap-4">
                    <div className="spinner"></div>
                    <span className="text-sm text-[var(--text-secondary)]">{t('rooms.loadingAppliances')}</span>
                  </div>
                ) : inspectedRoom.devices && inspectedRoom.devices.length > 0 ? (
                  <div className="space-y-3">
                    {inspectedRoom.devices.map(device => {
                      const isOn = device.status === 'On';
                      const isOffline = device.status === 'Offline';

                      return (
                        <div key={device.deviceId} className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] dark:bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Plug size={16} className={isOffline ? 'text-[var(--text-muted)]' : isOn ? 'text-[var(--accent-success)]' : 'text-[var(--text-secondary)]'} />
                            <div>
                              <strong className="text-sm text-[var(--text-primary)]">{device.name}</strong>
                              <span className="text-xs text-[var(--text-secondary)] block">{device.type} &bull; {device.powerConsumption}W</span>
                            </div>
                          </div>

                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={isOn}
                              onChange={() => handleToggleDevice(device)}
                              disabled={isOffline}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-[var(--text-secondary)] text-sm flex-col">
                    <p className="font-semibold text-[var(--text-primary)]">{t('rooms.noActiveAppliances')}</p>
                    <p className="text-xs text-center mt-1">{t('rooms.goToDevices')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CRUD Room Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(9,13,12,0.6)] backdrop-blur-[8px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-[480px] w-full shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingRoom ? t('rooms.modifyDivision') : t('rooms.createDivision')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleModalSubmit)} className="p-6">
              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('rooms.roomNameLabel')}</label>
                <input
                  type="text"
                  className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                  placeholder={t('rooms.roomNamePlaceholder')}
                  disabled={submitting}
                  {...register('roomName', { required: t('rooms.roomNameRequired') })}
                />
                {errors.roomName && <span className="text-xs text-red-500 mt-1">{errors.roomName.message}</span>}
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('rooms.descriptionLabel')}</label>
                <textarea
                  className="min-h-[100px] px-4 py-3 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full resize-y"
                  placeholder={t('rooms.descriptionPlaceholder')}
                  disabled={submitting}
                  {...register('description')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <span className="spinner border-t-white w-4 h-4 inline-block"></span> : t('rooms.saveRoom')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default Rooms;
