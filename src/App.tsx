import React, { useState, useEffect, useCallback } from 'react';
import { 
  P2HFormRecord, 
  VehicleUnit, 
  MaintenanceLog, 
  UserRole,
  UserProfile,
  NotificationItem,
  AppSettings
} from './types/p2h';
import { 
  INITIAL_VEHICLES, 
  INITIAL_P2H_RECORDS, 
  INITIAL_MAINTENANCE_LOGS 
} from './data/initialData';
import { P2HFormEditor } from './components/P2HFormEditor';
import { UnitManagerView } from './components/UnitManagerView';
import { P2HLogView } from './components/P2HLogView';
import { OfficialPdfPrintView } from './components/OfficialPdfPrintView';
import { AccountProfileView, INITIAL_ACCOUNTS } from './components/AccountProfileView';
import { SettingsView } from './components/SettingsView';
import { NotificationBell } from './components/NotificationBell';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ChargingLogView } from './components/ChargingLogView';
import { realtimeSync, API_BASE_URL } from './services/realtimeSync';
import { 
  ClipboardList, 
  FileText, 
  Truck, 
  User, 
  Settings, 
  RotateCcw, 
  LogOut, 
  Shield, 
  Zap, 
  BatteryCharging, 
  Cog, 
  BarChart3, 
  Menu, 
  X, 
  ChevronDown, 
  RefreshCw 
} from 'lucide-react';
import { playTriggerSound, playSuccessChime } from './utils/audio';

const STORAGE_KEYS = {
  VEHICLES: 'jac_t9_vehicles_v6',
  RECORDS: 'jac_t9_p2h_records_v6',
  LOGS: 'jac_t9_maint_logs_v6',
  USERS: 'jac_t9_users_v6',
  CURRENT_USER: 'jac_t9_curr_user_v6',
  ACTIVE_USER_ID: 'jac_t9_active_user_id_v6',
  SETTINGS: 'jac_t9_settings_v6',
  NOTIFICATIONS: 'jac_t9_notifs_v6',
  IS_LOGGED_IN: 'jac_t9_is_logged_in_v6'
};

const DEFAULT_SETTINGS: AppSettings = {
  primaryColor: '#0284c7',
  themePreset: 'blue',
  fontFamily: 'Plus Jakarta Sans',
  companyName: 'PT MULIABARA MINING',
  tagline: 'LIGHT VEHICLE EV FLEET',
  appTitle: 'JAC T9 EV',
  appIcon: 'lightning',
  soundEnabled: true,
  soundProfile: 'modern_chime'
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: '🔔 Permintaan Persetujuan P2H Baru',
    message: 'Operator Budi Santoso telah mengajukan formulir P2H untuk unit LV-EV-01 (Shift 1). Menunggu persetujuan Pengawas (Khusus Admin).',
    timestamp: 'Baru saja',
    type: 'p2h_submitted',
    read: false,
    formId: 'p2h-2026-001',
    unitNumber: 'LV-EV-01',
    operatorName: 'Budi Santoso',
    targetRole: 'admin'
  }
];

export default function App() {
  // Login State - Default to FALSE so opening requires passing through LoginView
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Vehicles State
  const [vehicles, setVehicles] = useState<VehicleUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return saved ? JSON.parse(saved) : [];
  });

  // P2H Records State
  const [p2hRecords, setP2hRecords] = useState<P2HFormRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Maintenance Logs State
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  // Fallback Admin Account
  const DEFAULT_ADMIN_USER: UserProfile = INITIAL_ACCOUNTS[0];

  // Users Accounts State with migration fallback
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id));
        }
      }
    } catch {
      // fallback
    }
    return [DEFAULT_ADMIN_USER];
  });

  // Current Logged In User State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
      if (activeId) {
        const found = INITIAL_ACCOUNTS.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ADMIN_USER;
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNav, setActiveNav] = useState<'dashboard' | 'p2h' | 'log' | 'charging_log' | 'units' | 'account' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NAV_LABELS: Record<string, string> = {
    dashboard: 'Dashboard Telemetri EV',
    p2h: 'Formulir P2H Baru',
    log: 'Log & Arsip P2H',
    charging_log: 'Log EV Charging SPKLU',
    units: 'Daftar Unit Fleet EV',
    account: 'Profil & Hak Akses Akun',
    settings: 'Pengaturan Sistem'
  };

  // Editing state for P2H form
  const [editingForm, setEditingForm] = useState<P2HFormRecord | null>(null);

  // Official PDF Print Preview / Download Target
  const [printableForm, setPrintableForm] = useState<P2HFormRecord | null>(null);

  // Safe active user guarantee
  const activeUser: UserProfile = (currentUser && currentUser.id && currentUser.role) ? currentUser : DEFAULT_ADMIN_USER;
  const isAdmin = activeUser.role === 'Master Admin' || activeUser.role === 'admin';

  // Ensure currentUser is healed if cleared
  useEffect(() => {
    if (!currentUser || !currentUser.id || !currentUser.role) {
      setCurrentUser(DEFAULT_ADMIN_USER);
    }
  }, [currentUser, DEFAULT_ADMIN_USER]);

  // If non-admin is on settings, redirect to 'p2h'
  useEffect(() => {
    if (!isAdmin && activeNav === 'settings') {
      setActiveNav('p2h');
    }
  }, [isAdmin, activeNav]);

  // Global Realtime Cloud Sync State (Netlify <-> Google AI Studio <-> Mobile <-> PC)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  // Subscribe to Realtime Updates & Connection Status
  useEffect(() => {
    // 1. Subscribe to realtime updates emitted by any device
    const unsubscribeData = realtimeSync.subscribe((payload) => {
      if (Array.isArray(payload.records) && payload.records.length > 0) setP2hRecords(payload.records);
      if (Array.isArray(payload.vehicles) && payload.vehicles.length > 0) setVehicles(payload.vehicles);
      if (Array.isArray(payload.notifications)) setNotifications(payload.notifications);
      if (Array.isArray(payload.users) && payload.users.length > 0) {
        const validUsers = payload.users.filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id));
        if (validUsers.length > 0) setAllUsers(validUsers);
      }
      if (payload.settings && typeof payload.settings === 'object' && payload.settings.primaryColor) setSettings(payload.settings);
    });

    // 2. Subscribe to Firebase Firestore updates
    const unsubscribeFirebase = realtimeSync.subscribeToFirebase((payload) => {
        // Same logic as standard sync
        if (Array.isArray(payload.records) && payload.records.length > 0) setP2hRecords(payload.records);
        if (Array.isArray(payload.vehicles) && payload.vehicles.length > 0) setVehicles(payload.vehicles);
        if (Array.isArray(payload.notifications)) setNotifications(payload.notifications);
        if (Array.isArray(payload.users) && payload.users.length > 0) {
            const validUsers = payload.users.filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id));
            if (validUsers.length > 0) setAllUsers(validUsers);
        }
        if (payload.settings && typeof payload.settings === 'object' && payload.settings.primaryColor) setSettings(payload.settings);
    });

    // 3. Subscribe to sync connection status
    const unsubscribeStatus = realtimeSync.subscribeStatus((status, time) => {
      setSyncStatus(status);
      if (time) setLastSyncTime(time);
    });

    return () => {
      unsubscribeData();
      unsubscribeFirebase();
      unsubscribeStatus();
    };
  }, []);

  // Sync state with LocalStorage for offline resilience
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(p2hRecords));
  }, [p2hRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(maintenanceLogs));
  }, [maintenanceLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Apply custom theme font to root body
  useEffect(() => {
    if (settings.fontFamily) {
      document.body.style.fontFamily = `'${settings.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    }
  }, [settings.fontFamily]);

  // Force trigger sync
  const handleForceSync = async () => {
    setIsManualSyncing(true);
    await realtimeSync.forceSyncNow({
      records: p2hRecords,
      vehicles: vehicles,
      users: allUsers,
      notifications: notifications,
      settings: settings
    });
    setTimeout(() => {
      setIsManualSyncing(false);
    }, 800);
  };

  // Handler: Login Success
  const handleLoginSuccess = (user: UserProfile) => {
    const safeUser = (user && user.id && user.role) ? user : DEFAULT_ADMIN_USER;
    setCurrentUser(safeUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, safeUser.id);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    setIsLoggedIn(true);
    playTriggerSound();
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
    setIsLoggedIn(false);
    playTriggerSound();
  };

  // Handler: Save or Update P2H Form
  const handleSaveP2H = (savedForm: P2HFormRecord) => {
    let updatedRecords: P2HFormRecord[] = [];
    setP2hRecords(prev => {
      const exists = prev.some(r => r.id === savedForm.id);
      if (exists) {
        updatedRecords = prev.map(r => (r.id === savedForm.id ? savedForm : r));
      } else {
        updatedRecords = [savedForm, ...prev];
      }
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords));
      return updatedRecords;
    });

    let updatedVehicles: VehicleUnit[] = [];
    setVehicles(prevVehicles => {
      updatedVehicles = prevVehicles.map(veh => {
        if (veh.unitNumber === savedForm.unitNumber) {
          return {
            ...veh,
            currentOdoKm: savedForm.endKm,
            currentSoc: savedForm.endSoc,
            cumulativeKwh: (veh.cumulativeKwh || 0) + (savedForm.energyConsumedKwh || 0),
            assignedDriver: savedForm.operatorName,
            location: savedForm.workLocation,
            status: savedForm.overallStatus === 'approved' ? 'operating' : veh.status
          };
        }
        return veh;
      });
      return updatedVehicles;
    });

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: `🔔 Permintaan Approval P2H (${savedForm.unitNumber})`,
      message: `Driver ${savedForm.operatorName} telah mengajukan P2H unit ${savedForm.unitNumber} (${savedForm.shift}). Menunggu persetujuan resmi Pengawas/Admin.`,
      timestamp: 'Baru saja',
      type: 'p2h_submitted',
      read: false,
      formId: savedForm.id,
      unitNumber: savedForm.unitNumber,
      operatorName: savedForm.operatorName,
      targetRole: 'admin'
    };

    let updatedNotifications: NotificationItem[] = [];
    setNotifications(prev => {
      updatedNotifications = [newNotif, ...prev];
      return updatedNotifications;
    });

    // Realtime sync across devices immediately after transaction
    const payload = {
      records: updatedRecords.length ? updatedRecords : [savedForm, ...p2hRecords],
      vehicles: updatedVehicles.length ? updatedVehicles : vehicles,
      notifications: [newNotif, ...notifications]
    };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);

    setEditingForm(null);
    setActiveNav('log');
  };

  // Handler: Quick Approve from Notification Bell
  const handleQuickApproveFromBell = (formId: string, notifId?: string) => {
    if (activeUser.role !== 'admin' && activeUser.role !== 'Master Admin') {
      alert('Akses Ditolak: Hanya Akun Admin yang memiliki hak otorisasi untuk menyetujui (Approve) P2H.');
      return;
    }

    const approvingAdmin = activeUser;
    let updatedRecords: P2HFormRecord[] = [];

    setP2hRecords(prev => {
      updatedRecords = prev.map(r => {
        if (r.id === formId) {
          return {
            ...r,
            updatedAt: new Date().toISOString(),
            overallStatus: 'approved' as const,
            foremanApproval: {
              status: 'approved' as const,
              notes: 'Disetujui resmi melalui Lonceng Pemberitahuan K3.',
              foremanName: approvingAdmin.name,
              foremanNik: approvingAdmin.nik,
              signatureUrl: approvingAdmin.signatureDataUrl || r.foremanApproval.signatureUrl,
              approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
            }
          };
        }
        return r;
      });
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords));
      return updatedRecords;
    });

    let updatedNotifications: NotificationItem[] = [];
    let singleApproved = false;
    setNotifications(prev => {
      updatedNotifications = prev.map(n => {
        const isTarget = notifId 
          ? n.id === notifId 
          : (!singleApproved && n.formId === formId && n.type === 'p2h_submitted');
        
        if (isTarget) {
          singleApproved = true;
          return {
            ...n,
            read: true,
            title: `✅ Disetujui: ${n.unitNumber || 'P2H'}`,
            message: `Formulir P2H telah disetujui resmi oleh ${approvingAdmin.name} (Admin). Unit diizinkan beroperasi.`,
            type: 'p2h_approved' as const
          };
        }
        return n;
      });
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      return updatedNotifications;
    });

    const payload = {
      records: updatedRecords,
      notifications: updatedNotifications
    };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);

    playSuccessChime();
  };

  // Handler: Delete P2H Form
  const handleDeleteP2H = (recordId: string) => {
    let updatedRecords: P2HFormRecord[] = [];
    setP2hRecords(prev => {
      updatedRecords = prev.filter(r => r.id !== recordId);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords));
      return updatedRecords;
    });

    let updatedNotifs: NotificationItem[] = [];
    setNotifications(prev => {
      updatedNotifs = prev.filter(n => n.formId !== recordId);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifs));
      return updatedNotifs;
    });

    const payload = {
      records: updatedRecords,
      notifications: updatedNotifs
    };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);

    playTriggerSound();
  };

  // Handler: Add New Vehicle
  const handleAddVehicle = (newVeh: VehicleUnit) => {
    const payload = { vehicles: updated };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
    playTriggerSound();
  };

  const handleUpdateVehicle = (updatedVeh: VehicleUnit) => {
    let updated: VehicleUnit[] = [];
    setVehicles(prev => {
      updated = prev.map(v => (v.id === updatedVeh.id ? updatedVeh : v));
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
      return updated;
    });
    const payload = { vehicles: updated };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
  };

  const handleDeleteVehicle = (unitId: string) => {
    let updated: VehicleUnit[] = [];
    setVehicles(prev => {
      updated = prev.filter(v => v.id !== unitId);
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
      return updated;
    });
    const payload = { vehicles: updated };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
  };

  // Handlers for User Management
  const handleAddUser = (newUser: UserProfile) => {
    const updated = [newUser, ...allUsers];
    setAllUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    const payload = { users: updated };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
    playTriggerSound();
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const updated = allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
    setAllUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    if (activeUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, updatedUser.id);
    }
    const payload = { users: updated };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
    playTriggerSound();
  };

  const handleDeleteUser = (userId: string) => {
    const updated = allUsers.filter(u => u.id !== userId);
    setAllUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    const payload = { users: updated };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
    playTriggerSound();
  };

  const handleSwitchUser = (user: UserProfile) => {
    const safeUser = (user && user.id && user.role) ? user : DEFAULT_ADMIN_USER;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, safeUser.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    playTriggerSound();
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    const payload = { settings: newSettings };
    realtimeSync.pushUpdate(payload);
    realtimeSync.syncToFirebase(payload);
  };

  // Reset Demo Data / Clear All Data
  const handleClearData = () => {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data? Aplikasi akan di-reset ke status kosong (Admin tetap tersimpan).')) {
      localStorage.clear();
      setVehicles([]);
      setP2hRecords([]);
      setMaintenanceLogs([]);
      setAllUsers([DEFAULT_ADMIN_USER]);
      setCurrentUser(DEFAULT_ADMIN_USER);
      setSettings(DEFAULT_SETTINGS);
      setNotifications([]);
      alert('Data berhasil dihapus.');
      setActiveNav('dashboard');
    }
  };


  // 1. If not logged in, render the Simplified Main Login Page
  if (!isLoggedIn) {
    return (
      <LoginView
        users={allUsers}
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 2. If printable view is active, render print layout exclusively
  if (printableForm) {
    return (
      <OfficialPdfPrintView
        form={printableForm}
        settings={settings}
        onClose={() => setPrintableForm(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-700 font-sans antialiased relative selection:bg-blue-600 selection:text-white">
      
      {/* 1. CREATIVE TIM SOFT UI SIDENAV (SIDEBAR NAVIGATION) */}
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden transition-opacity"
        />
      )}

      {/* Sidenav Container */}
      <aside className={`fixed inset-y-0 left-0 my-4 ml-4 w-64 rounded-2xl bg-white shadow-soft-xl border-0 p-4 z-50 flex flex-col justify-between transition-transform duration-300 xl:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Sidenav Brand Header */}
            <div className="flex items-center justify-between px-2 py-3">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-8 max-w-28 object-contain" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tl from-blue-700 to-cyan-500 shadow-soft-2xl flex items-center justify-center text-white font-black text-sm shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                )}
                <div className="leading-tight">
                  <span className="font-extrabold text-sm text-slate-800 tracking-tight block">
                    {settings.appTitle || 'JAC T9 EV'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono block">
                    {settings.companyName || 'PT MULIABARA'}
                  </span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 xl:hidden rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <hr className="h-px my-3 bg-gradient-to-r from-transparent via-slate-200 to-transparent border-0" />

            {/* Sidenav Links */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-22rem)] py-1 pr-1">
              
              {/* Group 1: PAGES & OPERASIONAL */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-2 font-mono">
                  DASHBOARD & OPERASIONAL
                </span>
                <ul className="space-y-1">
                  {/* Dashboard */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('dashboard'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'dashboard'
                          ? 'bg-white shadow-soft-xl text-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'dashboard'
                          ? 'bg-gradient-to-tl from-blue-700 to-cyan-500 text-white'
                          : 'bg-white shadow-soft-sm text-slate-700'
                      }`}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span>Dashboard Telemetri</span>
                    </button>
                  </li>

                  {/* P2H Baru */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('p2h'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'p2h'
                          ? 'bg-white shadow-soft-xl text-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'p2h'
                          ? 'bg-gradient-to-tl from-slate-800 to-slate-900 text-white'
                          : 'bg-white shadow-soft-sm text-slate-700'
                      }`}>
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <span>Formulir P2H Baru</span>
                    </button>
                  </li>

                  {/* Log P2H */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('log'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'log'
                          ? 'bg-white shadow-soft-xl text-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'log'
                            ? 'bg-gradient-to-tl from-emerald-600 to-teal-400 text-white'
                            : 'bg-white shadow-soft-sm text-slate-700'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <span>Log & Arsip P2H</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {p2hRecords.length}
                      </span>
                    </button>
                  </li>

                  {/* Log Charging */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('charging_log'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'charging_log'
                          ? 'bg-white shadow-soft-xl text-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'charging_log'
                          ? 'bg-gradient-to-tl from-amber-500 to-orange-400 text-white'
                          : 'bg-white shadow-soft-sm text-slate-700'
                      }`}>
                        <BatteryCharging className="w-4 h-4" />
                      </div>
                      <span>Log EV Charging</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Group 2: ARMADA & MANAJEMEN */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-2 font-mono">
                  ARMADA & MANAJEMEN
                </span>
                <ul className="space-y-1">
                  {/* Daftar Unit */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('units'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'units'
                          ? 'bg-white shadow-soft-xl text-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'units'
                            ? 'bg-gradient-to-tl from-purple-700 to-pink-500 text-white'
                            : 'bg-white shadow-soft-sm text-slate-700'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span>Daftar Unit Fleet</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {vehicles.length}
                      </span>
                    </button>
                  </li>

                  {/* Akun */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('account'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'account'
                          ? 'bg-white shadow-soft-xl text-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'account'
                            ? 'bg-gradient-to-tl from-rose-500 to-pink-500 text-white'
                            : 'bg-white shadow-soft-sm text-slate-700'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <span>Profil & Hak Akses</span>
                      </div>
                      {isAdmin && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                          Admin
                        </span>
                      )}
                    </button>
                  </li>

                  {/* Pengaturan (Admin) */}
                  {isAdmin && (
                    <li>
                      <button
                        type="button"
                        onClick={() => { setActiveNav('settings'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeNav === 'settings'
                            ? 'bg-white shadow-soft-xl text-slate-800'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'settings'
                            ? 'bg-gradient-to-tl from-slate-600 to-slate-800 text-white'
                            : 'bg-white shadow-soft-sm text-slate-700'
                        }`}>
                          <Cog className="w-4 h-4" />
                        </div>
                        <span>Pengaturan Sistem</span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>

          {/* Sidenav Bottom Help Widget Card (Creative Tim style) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-tl from-slate-900 via-slate-800 to-slate-900 text-white shadow-soft-xl relative overflow-hidden mt-3">
            <div className="relative z-10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center backdrop-blur-md">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <span className="font-bold text-xs block text-white">CATL LFP 88.02 kWh</span>
                <span className="text-[10px] text-slate-300 block">JAC T9 EV 4x4 Double Cabin</span>
              </div>
              <button
                type="button"
                onClick={() => { setActiveNav('p2h'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                className="w-full py-1.5 px-3 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-soft-sm text-center block"
              >
                + Buat P2H Baru
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT CANVAS (SHIFTED ON DESKTOP VIA xl:ml-72) */}
      <div className="xl:ml-72 min-h-screen p-4 xl:p-6 flex flex-col justify-between transition-all duration-300">
        
        {/* TOP FLOATING GLASSMORPHIC NAVBAR (Soft UI Navbar) */}
        <nav className="sticky top-4 z-30 mb-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-soft-sm border border-white/60 p-3 sm:p-4 flex items-center justify-between gap-3">
          
          {/* Left: Breadcrumbs & Page Title */}
          <div>
            <nav aria-label="breadcrumb">
              <ol className="flex flex-wrap pt-0 mr-12 bg-transparent rounded-lg sm:mr-16 text-slate-400 text-xs">
                <li className="leading-normal">
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveNav('dashboard'); }} className="opacity-50 hover:opacity-100 text-slate-700">Pages</a>
                </li>
                <li className="text-xs pl-2 capitalize leading-normal text-slate-700 before:float-left before:pr-2 before:text-slate-400 before:content-['/']" aria-current="page">
                  {NAV_LABELS[activeNav] || activeNav}
                </li>
              </ol>
              <h6 className="mb-0 font-bold capitalize text-slate-800 text-sm sm:text-base tracking-tight">
                {NAV_LABELS[activeNav] || activeNav}
              </h6>
            </nav>
          </div>

          {/* Right: Actions, Cloud Sync, Bell & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Realtime Status Indicator & Manual Sync Button */}
            <button
              type="button"
              onClick={handleForceSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono shadow-soft-xxs border cursor-pointer transition-all ${
                syncStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : syncStatus === 'syncing' || isManualSyncing
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title={`Status Cloud Sync: ${syncStatus === 'connected' ? 'Aktif (Real-Time)' : syncStatus} · Terakhir: ${lastSyncTime || 'Baru saja'}. Klik untuk sinkronisasi paksa.`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || syncStatus === 'syncing' ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} />
              <span className="font-bold hidden sm:inline">
                {isManualSyncing ? 'Syncing...' : syncStatus === 'connected' ? 'Cloud Sync' : 'Offline'}
              </span>
            </button>

            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              currentUser={activeUser}
              onMarkAsRead={id => {
                const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
                setNotifications(updated);
                realtimeSync.pushUpdate({ notifications: updated });
              }}
              onMarkAllAsRead={() => {
                const updated = notifications.map(n => ({ ...n, read: true }));
                setNotifications(updated);
                realtimeSync.pushUpdate({ notifications: updated });
              }}
              onQuickApprove={handleQuickApproveFromBell}
              onViewForm={formId => {
                const target = p2hRecords.find(r => r.id === formId);
                if (target) {
                  setPrintableForm(target);
                }
              }}
            />

            {/* User Profile Pill Badge */}
            <button
              onClick={() => setActiveNav('account')}
              className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-white border border-slate-200 shadow-soft-xxs rounded-xl transition-all text-xs text-left cursor-pointer hover:bg-slate-50"
              title={`Masuk sebagai: ${activeUser.name} (@${activeUser.username || activeUser.nik})`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tl from-blue-700 to-cyan-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-soft-sm shrink-0">
                {(activeUser.name || 'Admin').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden md:block">
                <span className="font-bold text-slate-800 block text-xs leading-tight truncate max-w-28">
                  {activeUser.name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono block leading-tight uppercase font-bold">
                  {activeUser.role}
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 rounded-xl transition-colors shadow-soft-xxs cursor-pointer bg-white"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl xl:hidden cursor-pointer shadow-soft-xxs border border-slate-200 bg-white"
              title="Buka Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>

        {/* MAIN BODY VIEW */}
        <main className="w-full flex-1 space-y-6">
          {/* 0. HALAMAN UTAMA DASHBOARD */}
          {activeNav === 'dashboard' && (
            <DashboardView
              vehicles={vehicles}
              records={p2hRecords}
              settings={settings}
              onNavigate={nav => setActiveNav(nav)}
              onCreateP2H={() => {
                setEditingForm(null);
                setActiveNav('p2h');
              }}
            />
          )}

          {/* 1. HALAMAN P2H */}
          {activeNav === 'p2h' && (
            <P2HFormEditor
              vehicles={vehicles}
              initialForm={editingForm}
              currentUser={activeUser}
              allUsers={allUsers}
              onSave={handleSaveP2H}
              onCancel={() => {
                setEditingForm(null);
                setActiveNav('log');
              }}
            />
          )}

          {/* 2. HALAMAN LOG P2H */}
          {activeNav === 'log' && (
            <P2HLogView
              records={p2hRecords}
              vehicles={vehicles}
              settings={settings}
              onEditRecord={record => {
                setEditingForm(record);
                setActiveNav('p2h');
              }}
              onDeleteRecord={handleDeleteP2H}
              onPrintRecord={record => setPrintableForm(record)}
              onDownloadPdfRecord={record => setPrintableForm(record)}
              onCreateNew={() => {
                setEditingForm(null);
                setActiveNav('p2h');
              }}
            />
          )}

          {/* 2.5 HALAMAN LOG EV CHARGING */}
          {activeNav === 'charging_log' && (
            <ChargingLogView
              records={p2hRecords}
              vehicles={vehicles}
              settings={settings}
            />
          )}

          {/* 3. HALAMAN DAFTAR UNIT (CRUD) */}
          {activeNav === 'units' && (
            <UnitManagerView
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {/* 4. HALAMAN MANAJEMEN AKUN */}
          {activeNav === 'account' && (
            <AccountProfileView
              currentUser={activeUser}
              allUsers={allUsers}
              onSwitchUser={handleSwitchUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {/* 5. HALAMAN PENGATURAN (KHUSUS ADMIN) */}
          {activeNav === 'settings' && (
            <SettingsView
              settings={settings}
              currentUser={activeUser}
              onUpdateSettings={handleUpdateSettings}
              onClearData={handleClearData}
            />
          )}
        </main>

        {/* SOFT UI FOOTER */}
        <footer className="mt-8 py-4 no-print text-center sm:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/60">
          <p className="mb-0">
            © 2026, built with Creative Tim Soft UI style for <span className="font-bold text-slate-700">PT MULIABARA MINING</span> · JAC T9 EV Fleet
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>F-QHSE-OPS-MOB-09</span>
            <span>·</span>
            <span>CATL 88.02 kWh</span>
            <span>·</span>
            <span>Site Kutai</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
