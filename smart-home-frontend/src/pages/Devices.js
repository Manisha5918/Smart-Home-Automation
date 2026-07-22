import React, { useState, useEffect } from 'react';
import { deviceService, roomService, favoriteDeviceService } from '../services/api';
import { useSignalR } from '../context/SignalRContext';
import { useForm } from 'react-hook-form';
import { Plug, Pencil, Trash2, Search, Plus, Tv, Lightbulb, Fan, Shield, HelpCircle, X, Thermometer, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Devices = () => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Modals state
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  // Form handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const deviceTypes = ['Light', 'AC', 'Fan', 'TV', 'Thermostat', 'Heater', 'Camera', 'Security System', 'Other'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [deviceData, roomData, favData] = await Promise.all([
        deviceService.getDevices(),
        roomService.getRooms(),
        favoriteDeviceService.getFavorites()
      ]);
      setDevices(deviceData);
      setRooms(roomData);
      setFavorites(favData);
    } catch (err) {
      console.error('Failed to load devices/rooms data:', err);
      toast.error(t('devices.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { on, off } = useSignalR();
  useEffect(() => {
    on('DeviceStatusChanged', loadData);
    on('DeviceAdded', loadData);
    on('DeviceRemoved', loadData);
    return () => {
      off('DeviceStatusChanged', loadData);
      off('DeviceAdded', loadData);
      off('DeviceRemoved', loadData);
    };
  }, [on, off]);

  const openAddModal = () => {
    setEditingDevice(null);
    reset({
      name: '',
      type: 'Light',
      roomId: '',
      location: '',
      status: 'Off',
      powerConsumption: 0
    });
    setCrudModalOpen(true);
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    reset({
      name: device.name,
      type: device.type,
      roomId: device.roomId || '',
      location: device.location || '',
      status: device.status,
      powerConsumption: device.powerConsumption
    });
    setCrudModalOpen(true);
  };

  const handleCrudSubmit = async (data) => {
    setSubmitting(true);
    const parsedRoomId = data.roomId ? parseInt(data.roomId) : null;
    const devicePayload = {
      name: data.name.trim(),
      type: data.type,
      roomId: parsedRoomId,
      location: data.location.trim() || 'General',
      status: data.status,
      powerConsumption: parseFloat(data.powerConsumption) || 0
    };

    try {
      if (editingDevice) {
        const updated = await deviceService.updateDevice(
  editingDevice.deviceId,
  devicePayload
);
        toast.success(t('devices.updated', { name: updated.name }));
      } else {
        const created = await deviceService.createDevice(devicePayload);
        toast.success(t('devices.registered', { name: created.name }));
      }
      setCrudModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t('devices.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t('devices.deleteConfirm', { name }))) return;
    try {
      await deviceService.deleteDevice(id);
      toast.success(t('devices.removed', { name }));
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t('devices.deleteFailed'));
    }
  };

const handleToggleStatus = async (device) => {
  try {
    const nextStatus = device.status === 'On' ? 'Off' : 'On';

    setDevices(prev =>
      prev.map(d =>
        d.deviceId === device.deviceId
          ? { ...d, status: nextStatus }
          : d
      )
    );

    await deviceService.updateDeviceStatus(
      device.deviceId,
      nextStatus
    );

    toast.success(
      nextStatus === 'On'
        ? t('devices.turnedOn', { name: device.name })
        : t('devices.turnedOff', { name: device.name })
    );
  } catch (err) {
    console.error(err);
    toast.error(t('devices.toggleFailed'));
    loadData();
  }
};

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Light': return <Lightbulb className="text-xl" />;
      case 'AC': return <Thermometer className="text-xl" />;
      case 'Fan': return <Fan className="text-xl" />;
      case 'TV': return <Tv className="text-xl" />;
      case 'Security System': return <Shield className="text-xl" />;
      default: return <Plug className="text-xl" />;
    }
  };

  const favoriteDeviceIds = new Set(favorites.map(f => f.deviceId));

  const handleToggleFavorite = async (device, e) => {
    e.stopPropagation();
    const existing = favorites.find(f => f.deviceId === device.deviceId);
    if (existing) {
      try {
        await favoriteDeviceService.removeFavorite(existing.favoriteId);
        setFavorites(prev => prev.filter(f => f.favoriteId !== existing.favoriteId));
        toast.success('Removed from favorites');
      } catch { toast.error('Failed to remove favorite'); }
    } else {
      try {
        const added = await favoriteDeviceService.addFavorite(device.deviceId);
        setFavorites(prev => [...prev, added]);
        toast.success('Added to favorites');
      } catch { toast.error('Failed to add favorite'); }
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesType = filterType === 'All' || device.type === filterType;
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (device.location && device.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFav = !showFavoritesOnly || favoriteDeviceIds.has(device.deviceId);
    return matchesType && matchesSearch && matchesFav;
  });

  const typeLabels = {
    'All': t('common.all'),
    'Light': t('common.light'),
    'AC': t('common.ac'),
    'Fan': t('common.fan'),
    'TV': t('common.tv'),
    'Security System': t('common.securitySystem')
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#1e293b]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[#5c6e6a] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('devices.ecosystemNodes')}</p>
          <h1 className="sr-only">Devices</h1>
          <h2 className="text-3xl font-bold text-[#0a5c53] tracking-tight">{t('devices.title')}</h2>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-transparent border border-[#0a5c53] text-[#0a5c53] font-bold text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-[#0a5c53] hover:text-white transition-all shadow-[0_4px_12px_rgba(10,92,83,0.05)] hover:scale-105 active:scale-95 duration-200"
        >
          <Plus className="text-xs" />
          {t('devices.registerDevice')}
        </button>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-[#0a5c53]/10 rounded-2xl p-4 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c6e6a] text-sm" />
          <input
            className="w-full bg-[#f3f7f6] border border-[#0a5c53]/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0a5c53] transition-all"
            placeholder={t('devices.searchByNode')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {/* Favorites toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              showFavoritesOnly
                ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm'
                : 'bg-[#f3f7f6] text-[#5c6e6a] hover:bg-[#e1ece8] border border-transparent'
            }`}
          >
            <Heart size={12} className={showFavoritesOnly ? 'fill-red-500' : ''} />
            Favorites
            {favorites.length > 0 && (
              <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full ${
                showFavoritesOnly ? 'bg-red-200 text-red-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {favorites.length}
              </span>
            )}
          </button>
          {['All', 'Light', 'AC', 'Fan', 'TV', 'Security System'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                filterType === type 
                  ? 'bg-[#0a5c53]/10 text-[#0a5c53] border border-[#0a5c53]/20 shadow-sm'
                  : 'bg-[#f3f7f6] text-[#5c6e6a] hover:bg-[#e1ece8] border border-transparent'
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>

      </div>

      {/* Devices Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-[#0a5c53] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-12 text-center text-[#5c6e6a] shadow-sm">
          <HelpCircle className="text-5xl mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">{t('devices.noDevicesMatching')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map((device) => {
            const isOn = device.status === 'On';
            return (
              <div 
                key={device.deviceId}
                className="bg-white border border-[#0a5c53]/10 rounded-2xl p-5 flex flex-col justify-between hover:border-[#0a5c53]/35 hover:shadow-[0_8px_30px_rgba(10,92,83,0.06)] transition-all duration-300 relative group shadow-sm"
              >
                
                {/* Top Row: Icon & Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    isOn 
                      ? 'bg-[#0a5c53]/10 border-[#0a5c53]/25 text-[#0a5c53] shadow-sm'
                      : 'bg-[#f3f7f6] border-[#0a5c53]/5 text-slate-400'
                  }`}>
                    {getDeviceIcon(device.type)}
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isOn}
                      onChange={() => handleToggleStatus(device)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0f523c] border border-transparent relative"></div>
                  </label>
                </div>

                {/* Info Block */}
                <div className="space-y-1 mb-6">
                  <h4 className="text-base font-bold text-[#0a5c53] group-hover:text-[#2ec4b6] transition-colors line-clamp-1">{device.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#0a5c53] bg-[#0a5c53]/5 px-2 py-0.5 rounded border border-[#0a5c53]/10">
                      {device.type}
                    </span>
                    <span className="text-[#5c6e6a] text-xs">{device.location || t('devices.noneGeneral')}</span>
                  </div>
                </div>

                {/* Bottom Row: Metrics & Actions */}
                <div className="flex items-center justify-between border-t border-[#0a5c53]/5 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#5c6e6a]">{t('devices.consumption')}</span>
                    <span className="text-sm font-extrabold text-[#1e293b] font-mono">{device.powerConsumption} <span className="text-[10px] font-normal text-[#5c6e6a]">W</span></span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => openEditModal(device)}
                      className="p-1.5 rounded-lg bg-[#f3f7f6] hover:bg-[#e1ece8] text-[#5c6e6a] hover:text-[#0a5c53] transition-all border border-[#0a5c53]/5"
                      title={t('devices.editNode')}
                    >
                      <Pencil className="text-xs" />
                    </button>
                    <button 
                      onClick={() => handleDelete(device.deviceId, device.name)}
                      className="p-1.5 rounded-lg bg-[#f3f7f6] hover:bg-red-500/10 text-[#5c6e6a] hover:text-red-600 transition-all border border-[#0a5c53]/5"
                      title={t('devices.deRegisterNode')}
                    >
                      <Trash2 className="text-xs" />
                    </button>
                  </div>
                  {/* Favorite Heart */}
                  <button
                    onClick={(e) => handleToggleFavorite(device, e)}
                    className={`p-1.5 rounded-lg transition-all ${
                      favoriteDeviceIds.has(device.deviceId)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-slate-300 hover:text-red-400'
                    }`}
                    title={favoriteDeviceIds.has(device.deviceId) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={16} className={favoriteDeviceIds.has(device.deviceId) ? 'fill-red-500' : ''} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit CRUD Modal */}
      {crudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#0a5c53]/15 w-full max-w-md rounded-2xl overflow-hidden shadow-xl p-6 md:p-8 animate-scale-up">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0a5c53]">{editingDevice ? t('devices.editDeviceSettings') : t('devices.registerNewDevice')}</h3>
              <button 
                onClick={() => setCrudModalOpen(false)}
                className="text-[#5c6e6a] hover:text-[#0a5c53] transition-colors"
              >
                <X className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCrudSubmit)} className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('devices.deviceName')}</label>
                <input
                  className="bg-[#f3f7f6] border border-[#0a5c53]/10 focus:border-[#0a5c53] rounded-lg p-2.5 text-xs text-[#1e293b] outline-none focus:ring-1 focus:ring-[#0a5c53] transition-all"
                  placeholder={t('devices.deviceNamePlaceholder')}
                  disabled={submitting}
                  {...register('name', { required: t('devices.deviceNameRequired') })}
                />
                {errors.name && <span className="text-red-600 text-[10px] mt-1">{errors.name.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('devices.deviceTypeLabel')}</label>
                  <select
                    className="bg-[#f3f7f6] border border-[#0a5c53]/10 focus:border-[#0a5c53] rounded-lg p-2.5 text-xs text-[#1e293b] outline-none focus:ring-1 focus:ring-[#0a5c53] transition-all"
                    disabled={submitting}
                    {...register('type')}
                  >
                    {deviceTypes.map(dt => <option key={dt} value={dt} className="bg-white">{dt}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('devices.statusLabel')}</label>
                  <select
                    className="bg-[#f3f7f6] border border-[#0a5c53]/10 focus:border-[#0a5c53] rounded-lg p-2.5 text-xs text-[#1e293b] outline-none focus:ring-1 focus:ring-[#0a5c53] transition-all"
                    disabled={submitting}
                    {...register('status')}
                  >
                    <option value="Off" className="bg-white">{t('common.off')}</option>
                    <option value="On" className="bg-white">{t('common.on')}</option>
                  </select>
                </div>
              </div>

<div className="grid grid-cols-2 gap-4">
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">
      {t('devices.roomLabel')}
    </label>

    <select
      className="bg-[#f3f7f6] border border-[#0a5c53]/10 focus:border-[#0a5c53] rounded-lg p-2.5 text-xs text-[#1e293b] outline-none focus:ring-1 focus:ring-[#0a5c53] transition-all"
      disabled={submitting}
      {...register('roomId')}
    >
      <option value="" className="bg-white">
        {t('devices.noneGeneral')}
      </option>

      {rooms.map(r => (
        <option
          key={r.roomId}
          value={r.roomId}
          className="bg-white"
        >
          {r.roomName}
        </option>
      ))}
    </select>
  </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('devices.powerRating')}</label>
                  <input
                    type="number"
                    step="any"
                    className="bg-[#f3f7f6] border border-[#0a5c53]/10 focus:border-[#0a5c53] rounded-lg p-2.5 text-xs text-[#1e293b] outline-none focus:ring-1 focus:ring-[#0a5c53] transition-all"
                    placeholder={t('devices.powerRatingPlaceholder')}
                    disabled={submitting}
                    {...register('powerConsumption', { required: t('devices.powerConsumptionRequired') })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('devices.locationDesc')}</label>
                <input
                  className="bg-[#f3f7f6] border border-[#0a5c53]/10 focus:border-[#0a5c53] rounded-lg p-2.5 text-xs text-[#1e293b] outline-none focus:ring-1 focus:ring-[#0a5c53] transition-all"
                  placeholder={t('devices.locationPlaceholder')}
                  disabled={submitting}
                  {...register('location')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#0a5c53]/5">
                <button
                  type="button"
                  onClick={() => setCrudModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5c6e6a] hover:text-[#0a5c53] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0a5c53] text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  {submitting ? t('devices.saving') : t('devices.confirm')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Devices;
