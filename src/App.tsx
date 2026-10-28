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
  Wifi, 
  CheckCircle2,
  Zap,
  BatteryCharging,
  Cog,
  BarChart3,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { playTriggerSound, playSuccessChime } from './utils/audio';

const STORAGE_KEYS = {
  VEHICLES: 'jac_t9_vehicles_v5',
  RECORDS: 'jac_t9_p2h_records_v5',
  LOGS: 'jac_t9_maint_logs_v5',
  USERS: 'jac_t9_users_v5',
  CURRENT_USER: 'jac_t9_curr_user_v5',
  ACTIVE_USER_ID: 'jac_t9_active_user_id_v5',
  SETTINGS: 'jac_t9_settings_v5',
  NOTIFICATIONS: 'jac_t9_notifs_v5',
  IS_LOGGED_IN: 'jac_t9_is_logged_in_v5'
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
  // Login State - Default directly to TRUE so user enters the application immediately
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Vehicles State
  const [vehicles, setVehicles] = useState<VehicleUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  // P2H Records State
  const [p2hRecords, setP2hRecords] = useState<P2HFormRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_P2H_RECORDS;
      if (Array.isArray(parsed)) {
        return Array.from(new Map(parsed.map(r => [r.id, r])).values());
      }
    } catch {
      // fallback
    }
    return INITIAL_P2H_RECORDS;
  });

  // Maintenance Logs State
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_LOGS;
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
          const validUsers = parsed
            .filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id))
            .map(u => ({
              ...u,
              role: u.role || 'operator',
              username: u.username || (u.role === 'admin' ? 'admin' : u.nik ? String(u.nik).toLowerCase().replace(/[^a-z0-9]/g, '') : `user_${u.id}`)
            }));
          if (validUsers.length > 0) return validUsers;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_ACCOUNTS;
  });

  // Current Logged In User State - strictly bound to ACTIVE_USER_ID & allUsers (Requirement 1)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      if (activeId) {
        const found = allUsers.find(u => u.id === activeId);
        if (found) return found;
      }
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          const matchInAll = allUsers.find(u => u.id === parsed.id);
          if (matchInAll) return matchInAll;
          return {
            ...DEFAULT_ADMIN_USER,
            ...parsed,
            role: parsed.role || 'admin',
            username: parsed.username || (parsed.role === 'admin' ? 'admin' : parsed.nik ? String(parsed.nik).toLowerCase().replace(/[^a-z0-9]/g, '') : 'admin')
          };
        }
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
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeNav, setActiveNav] = useState<'dashboard' | 'p2h' | 'log' | 'charging_log' | 'units' | 'account' | 'settings'>('dashboard');
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);

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

  // REQUIREMENT 8: If non-admin is on settings, redirect to 'p2h'
  useEffect(() => {
    if (!isAdmin && activeNav === 'settings') {
      setActiveNav('p2h');
    }
  }, [isAdmin, activeNav]);

  // REQUIREMENT 6: Realtime Synchronization (Mobile Phone <-> PC <-> Browser Tabs)
  useEffect(() => {
    // 1. Initial sync with server state (safeguarded for static deployment hosts like Netlify)
    fetch(`${API_BASE_URL}/api/state`)
      .then(res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(serverData => {
        if (serverData) {
          if (Array.isArray(serverData.records) && serverData.records.length > 0) setP2hRecords(serverData.records);
          if (Array.isArray(serverData.vehicles) && serverData.vehicles.length > 0) setVehicles(serverData.vehicles);
          if (Array.isArray(serverData.notifications) && serverData.notifications.length > 0) setNotifications(serverData.notifications);
          if (serverData.settings && typeof serverData.settings === 'object' && serverData.settings.primaryColor) setSettings(serverData.settings);
        }
      })
      .catch(() => {
        // Standalone client mode fallback (Netlify / Vercel / Static hosting)
      });

    // 2. Subscribe to realtime updates emitted by any device
    const unsubscribe = realtimeSync.subscribe((payload) => {
      if (Array.isArray(payload.records) && payload.records.length > 0) setP2hRecords(payload.records);
      if (Array.isArray(payload.vehicles) && payload.vehicles.length > 0) setVehicles(payload.vehicles);
      if (Array.isArray(payload.notifications)) setNotifications(payload.notifications);
      if (Array.isArray(payload.users) && payload.users.length > 0) {
        const validUsers = payload.users.filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id));
        if (validUsers.length > 0) setAllUsers(validUsers);
      }
      if (payload.settings && typeof payload.settings === 'object' && payload.settings.primaryColor) setSettings(payload.settings);
    });

    return unsubscribe;
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
    document.body.style.fontFamily = `'${settings.fontFamily}', system-ui, sans-serif`;
  }, [settings.fontFamily]);

  // Handler: Login Success (Requirement 4 & 1)
  const handleLoginSuccess = (user?: UserProfile) => {
    const safeUser = (user && user.id && user.role) ? user : DEFAULT_ADMIN_USER;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, safeUser.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    setIsLoggedIn(true);
    playTriggerSound();
  };

  // Handler: Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    playTriggerSound();
  };

  // Handler: Save P2H Form & Trigger Approval Notification (Requirements 1, 3, 6)
  const handleSaveP2H = (savedForm: P2HFormRecord) => {
    let updatedRecords: P2HFormRecord[] = [];
    setP2hRecords(prev => {
      const filtered = prev.filter(r => r.id !== savedForm.id);
      updatedRecords = [savedForm, ...filtered];
      return Array.from(new Map(updatedRecords.map(r => [r.id, r])).values());
    });

    // Update vehicle unit telemetry
    let updatedVehicles: VehicleUnit[] = [];
    setVehicles(prevVehicles => {
      updatedVehicles = prevVehicles.map(veh => {
        if (veh.unitNumber === savedForm.unitNumber) {
          const newCumulativeKwh = veh.cumulativeKwh + savedForm.energyConsumedKwh;
          let newStatus = veh.status;
          if (newCumulativeKwh >= veh.nextServiceKwh) {
            newStatus = 'maintenance_due';
          }
          return {
            ...veh,
            currentOdoKm: savedForm.endKm,
            currentSoc: savedForm.endSoc,
            cumulativeKwh: Number(newCumulativeKwh.toFixed(1)),
            status: newStatus
          };
        }
        return veh;
      });
      return updatedVehicles;
    });

    // Requirement 3: Saat Driver simpan & ajukan, munculkan pemberitahuan meminta persetujuan Approve ke Lonceng
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

    // REQUIREMENT 6: Realtime sync across devices immediately after transaction
    realtimeSync.pushUpdate({
      records: updatedRecords.length ? updatedRecords : [savedForm, ...p2hRecords],
      vehicles: updatedVehicles.length ? updatedVehicles : vehicles,
      notifications: [newNotif, ...notifications]
    });

    setEditingForm(null);
    setActiveNav('log');
  };

  // Handler: Quick Approve from Notification Bell (Requirement 3: strictly Admin only & attaches Foreman signature)
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
    setNotifications(prev => {
      updatedNotifications = prev.map(n => {
        const isTarget = notifId ? n.id === notifId : (n.formId === formId && n.type === 'p2h_submitted');
        if (isTarget) {
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

    // Broadcast approval realtime to Phone and other devices
    realtimeSync.pushUpdate({
      records: updatedRecords,
      notifications: updatedNotifications
    });

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

    realtimeSync.pushUpdate({
      records: updatedRecords,
      notifications: updatedNotifs
    });

    playTriggerSound();
  };

  // Handler: Add New Vehicle
  const handleAddVehicle = (newUnit: VehicleUnit) => {
    let updated: VehicleUnit[] = [];
    setVehicles(prev => {
      updated = [newUnit, ...prev];
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
      return updated;
    });
    realtimeSync.pushUpdate({ vehicles: updated });
  };

  // Handler: Update Vehicle
  const handleUpdateVehicle = (updatedUnit: VehicleUnit) => {
    let updated: VehicleUnit[] = [];
    setVehicles(prev => {
      updated = prev.map(v => (v.id === updatedUnit.id ? updatedUnit : v));
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
      return updated;
    });
    realtimeSync.pushUpdate({ vehicles: updated });
  };

  // Handler: Delete Vehicle
  const handleDeleteVehicle = (unitId: string) => {
    let updated: VehicleUnit[] = [];
    setVehicles(prev => {
      updated = prev.filter(v => v.id !== unitId);
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
      return updated;
    });
    realtimeSync.pushUpdate({ vehicles: updated });
  };

  // Handlers for User Management
  const handleAddUser = (newUser: UserProfile) => {
    const updated = [newUser, ...allUsers];
    setAllUsers(updated);
    realtimeSync.pushUpdate({ users: updated });
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
    realtimeSync.pushUpdate({ users: updated });
    playTriggerSound();
  };

  const handleDeleteUser = (userId: string) => {
    const updated = allUsers.filter(u => u.id !== userId);
    setAllUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    realtimeSync.pushUpdate({ users: updated });
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
    realtimeSync.pushUpdate({ settings: newSettings });
  };

  // Reset Demo Data
  const handleResetDemoData = () => {
    if (confirm('Reset seluruh data aplikasi ke sampel awal?')) {
      setVehicles(INITIAL_VEHICLES);
      setP2hRecords(INITIAL_P2H_RECORDS);
      setMaintenanceLogs(INITIAL_MAINTENANCE_LOGS);
      setAllUsers(INITIAL_ACCOUNTS);
      setCurrentUser(INITIAL_ACCOUNTS[0]);
      setSettings(DEFAULT_SETTINGS);
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.clear();
      setIsLoggedIn(true);
      setActiveNav('p2h');
      setEditingForm(null);

      realtimeSync.pushUpdate({
        vehicles: INITIAL_VEHICLES,
        records: INITIAL_P2H_RECORDS,
        users: INITIAL_ACCOUNTS,
        settings: DEFAULT_SETTINGS,
        notifications: INITIAL_NOTIFICATIONS
      });
    }
  };

  // 1. If not logged in, render the Simplified Main Login Page (Requirement 4 & 5)
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* FULL GLOSSY GLASS HEADER */}
      <header 
        className="sticky top-0 z-50 text-white backdrop-blur-2xl bg-slate-900/85 border-b border-white/20 shadow-2xl transition-all font-sans"
        style={{ backgroundColor: settings.primaryColor ? `${settings.primaryColor}E6` : undefined }}
      >
        {/* Isolated glossy glass ambient highlights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 via-white/10 to-indigo-500/20" />
          <div className="absolute -top-12 -left-10 w-96 h-28 bg-white/20 rounded-full blur-2xl transform -rotate-6" />
          <div className="absolute -bottom-8 right-20 w-80 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-10">
          
          {/* Brand Wordmark & Custom Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="h-8 max-w-28 object-contain filter drop-shadow-md" 
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/25 backdrop-blur-md border border-white/40 text-white flex items-center justify-center font-black text-sm tracking-widest shadow-md">
                JAC
              </div>
            )}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveNav('dashboard'); setEditingForm(null); }} 
              className="text-sm sm:text-base font-extrabold tracking-tight text-white drop-shadow-xs whitespace-nowrap"
            >
              {settings.appTitle} 
              <span className="font-medium text-white/80 text-xs hidden sm:inline ml-1.5">
                · {settings.companyName}
              </span>
            </a>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Realtime Status Indicator & Manual Sync Button */}
            <button
              type="button"
              onClick={() => {
                realtimeSync.pushUpdate({
                  records: p2hRecords,
                  vehicles: vehicles,
                  users: allUsers,
                  notifications: notifications,
                  settings: settings
                });
                alert('Tersinkronisasi! Data berhasil disinkronkan ke seluruh sesi terhubung (Netlify & Google AI Studio).');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] text-white font-mono shadow-2xs backdrop-blur-md border border-emerald-400/40 cursor-pointer transition-colors"
              title="Klik untuk sinkronisasi manual data secara real-time"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">Sync Aktif</span>
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

            {/* Current User Pill Badge */}
            <button
              onClick={() => setActiveNav('account')}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md rounded-full transition-all text-xs text-left cursor-pointer shadow-xs"
              title={`Masuk sebagai: ${activeUser.name} (@${activeUser.username || activeUser.nik})`}
            >
              <div className="w-6 h-6 rounded-full bg-white text-slate-900 font-extrabold text-[10px] flex items-center justify-center shadow-xs shrink-0">
                {(activeUser.name || 'Admin').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-white block text-[11px] leading-tight truncate max-w-20">
                  {activeUser.name}
                </span>
                <span className="text-[9px] text-white/80 font-mono block leading-tight uppercase font-medium">
                  {activeUser.role}
                </span>
              </div>
            </button>

            {/* Keluar / Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white/15 hover:bg-rose-500/80 border border-white/25 text-white rounded-xl transition-colors shadow-xs cursor-pointer backdrop-blur-md"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* GLOSSY SUB-HEADER NAVIGATION BAR WITH DASHBOARD DROPDOWN */}
      <nav className="sticky top-16 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-white/20 shadow-xl transition-all font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 relative">
          
          {/* Main Dashboard Dropdown Button Container */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setActiveNav('dashboard');
                setIsDashboardMenuOpen(!isDashboardMenuOpen);
              }}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md ${
                isDashboardMenuOpen || activeNav === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-sky-600/50 border border-sky-400'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/25'
              }`}
            >
              <BarChart3 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-sky-300 shrink-0" />
              <span className="sm:hidden font-bold">Dashboard</span>
              <span className="hidden sm:inline">Dashboard & Menu Navigasi</span>
              <ChevronDown className={`w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-200 ${isDashboardMenuOpen ? 'rotate-180 text-amber-300' : 'text-white/80'}`} />
            </button>

            {/* Glossy Glass Dropdown Menu containing ALL navigation icons */}
            {isDashboardMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in text-xs font-semibold space-y-1.5">
                <div className="px-2 py-1 border-b border-white/10 mb-1 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                  <span>Daftar Menu Navigasi</span>
                  <span className="text-[9px] bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full border border-sky-400/30">JAC T9 EV</span>
                </div>

                {/* 1. Dashboard Utama */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingForm(null);
                    setActiveNav('dashboard');
                    setIsDashboardMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    activeNav === 'dashboard'
                      ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                      : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">Dashboard Utama</span>
                      <span className="text-[10px] text-white/60 font-normal">Ringkasan & Telemetri 3D</span>
                    </div>
                  </div>
                  {activeNav === 'dashboard' && <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                </button>

                {/* 2. P2H */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingForm(null);
                    setActiveNav('p2h');
                    setIsDashboardMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    activeNav === 'p2h'
                      ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                      : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">P2H (Pemeriksaan Harian)</span>
                      <span className="text-[10px] text-white/60 font-normal">Buat Inspeksi Driver Baru</span>
                    </div>
                  </div>
                  {activeNav === 'p2h' && <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                </button>

                {/* 3. Log P2H */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('log');
                    setIsDashboardMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    activeNav === 'log'
                      ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                      : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">Log P2H</span>
                      <span className="text-[10px] text-white/60 font-normal">Riwayat Inspeksi & Export PDF</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-sky-500 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                    {p2hRecords.length}
                  </span>
                </button>

                {/* 4. Log Charging */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('charging_log');
                    setIsDashboardMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    activeNav === 'charging_log'
                      ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                      : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">Log Charging</span>
                      <span className="text-[10px] text-white/60 font-normal">Riwayat Pengisian SPKLU EV</span>
                    </div>
                  </div>
                  {activeNav === 'charging_log' && <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                </button>

                {/* 5. Daftar Unit */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('units');
                    setIsDashboardMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    activeNav === 'units'
                      ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                      : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">Daftar Unit</span>
                      <span className="text-[10px] text-white/60 font-normal">Status & Manajemen Armada EV</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500 text-slate-900 font-mono px-2 py-0.5 rounded-full font-bold">
                    {vehicles.length}
                  </span>
                </button>

                {/* 6. Manajemen Akun */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('account');
                    setIsDashboardMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    activeNav === 'account'
                      ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                      : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                      {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">{isAdmin ? 'Manajemen Akun' : 'Profil Akun'}</span>
                      <span className="text-[10px] text-white/60 font-normal">Hak Akses & Otorisasi</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
                      ADMIN
                    </span>
                  )}
                </button>

                {/* 7. Pengaturan (Admin Only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav('settings');
                      setIsDashboardMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      activeNav === 'settings'
                        ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                        : 'text-white/90 hover:bg-white/10 bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                        <Cog className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold">Pengaturan</span>
                        <span className="text-[10px] text-white/60 font-normal">Konfigurasi Sistem</span>
                      </div>
                    </div>
                    {activeNav === 'settings' && <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Active Nav Badge Indicator */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-white/70 whitespace-nowrap hidden sm:inline">Modul Aktif:</span>
            <div className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-bold font-mono whitespace-nowrap flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeNav === 'dashboard' && 'Dashboard Utama'}
              {activeNav === 'p2h' && 'P2H (Pemeriksaan Harian)'}
              {activeNav === 'log' && `Log P2H (${p2hRecords.length})`}
              {activeNav === 'charging_log' && 'Log EV Charging'}
              {activeNav === 'units' && `Daftar Unit (${vehicles.length})`}
              {activeNav === 'account' && (isAdmin ? 'Manajemen Akun' : 'Profil Akun')}
              {activeNav === 'settings' && 'Pengaturan'}
            </div>
          </div>

        </div>
      </nav>





      {/* MAIN VIEWPORT */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-8">
        
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

        {/* 1. HALAMAN P2H (1 HALAMAN LENGKAP - PROFIL SESUAI AKUN LOGIN, REKOMENDASI MEKANIK TIDAK OTOMATIS, FOREMAN APPROVAL VIA LONCENG) */}
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

        {/* 2. HALAMAN LOG P2H (DENGAN EDIT, DELETE & DOWNLOAD PDF) */}
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
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-slate-800">{settings.appTitle}</span>
            <span>·</span>
            <span>{settings.companyName}</span>
            <span>·</span>
            <span>F-QHSE-OPS-MOB-09</span>
          </div>

          <p className="text-center sm:text-right text-[11px]">
            Sistem Digital P2H Light Vehicle EV · Sinkronisasi Realtime PC & Ponsel · Keselamatan K3
          </p>
        </div>
      </footer>
    </div>
  );
}
