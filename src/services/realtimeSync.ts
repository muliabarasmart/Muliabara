// Realtime Cloud Synchronization Engine for Netlify <-> Google AI Studio <-> Mobile <-> PC
// Uses Global Cloud Pub/Sub SSE relay + Cloud Polling + BroadcastChannel + Local Server + LocalStorage
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export interface SyncPayload {
  action?: 'sync_full' | 'upsert_record' | 'delete_record' | 'update_vehicles' | 'update_users' | 'update_notifications' | 'update_settings';
  records?: any[];
  vehicles?: any[];
  notifications?: any[];
  users?: any[];
  settings?: any;
  permissions?: any;
  version?: number;
  originId?: string;
  sourceDevice?: string;
  timestamp?: string;
}

type SyncCallback = (payload: SyncPayload) => void;
type StatusCallback = (status: 'connected' | 'syncing' | 'offline', lastSyncTime?: string) => void;

const GLOBAL_CLOUD_TOPIC = 'https://ntfy.sh/muliabara_jac_t9_ev_fleet_sync_2026';

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  public isConnected = false;
  public connectionStatus: 'connected' | 'syncing' | 'offline' = 'offline';
  public lastSyncTime: string = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  public clientId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  private lastKnownVersion = 0;
  private reconnectTimeout: any = null;
  private pollInterval: any = null;
  private isPublishing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('jac_t9_ev_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.state) {
            this.handleIncomingPayload(event.data.state as SyncPayload);
          }
        };
      } catch {
      }

      this.connectCloudSSE();
      this.startCloudPolling();
      this.fetchLatestCloudState();
    }
  }

  private connectCloudSSE() {
    if (typeof window === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.updateStatus('syncing');

      const sseUrl = `${GLOBAL_CLOUD_TOPIC}/sse`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.updateStatus('connected');
      };

      this.eventSource.onmessage = async (e) => {
        try {
          const parsed = JSON.parse(e.data);
          let innerData: SyncPayload | null = null;

          if (parsed?.attachment?.url) {
            try {
              const res = await fetch(parsed.attachment.url);
              innerData = await res.json();
            } catch (err) {
              console.warn('Failed to fetch SSE attachment:', err);
            }
          } else if (parsed && parsed.message) {
            if (typeof parsed.message === 'string') {
              try {
                innerData = JSON.parse(parsed.message);
              } catch {
                innerData = null;
              }
            } else {
              innerData = parsed.message;
            }
          }

          if (innerData && innerData.originId !== this.clientId) {
            this.handleIncomingPayload(innerData);
          }
        } catch {
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.updateStatus('offline');
        this.eventSource?.close();
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connectCloudSSE(), 5000);
      };
    } catch {
      this.isConnected = false;
      this.updateStatus('offline');
    }
  }

  public async fetchLatestCloudState() {
    try {
      this.updateStatus('syncing');
      const res = await fetch(`${GLOBAL_CLOUD_TOPIC}/json?poll=1`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n').filter(Boolean);
        
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const row = JSON.parse(lines[i]);
            let payload: SyncPayload | null = null;

            if (row.attachment?.url) {
              try {
                const attRes = await fetch(row.attachment.url);
                payload = await attRes.json();
              } catch {
                payload = null;
              }
            } else if (row.message) {
              payload = typeof row.message === 'string' 
                ? JSON.parse(row.message) 
                : row.message;
            }

            if (payload && payload.version && payload.version > this.lastKnownVersion) {
              if (payload.originId !== this.clientId) {
                this.handleIncomingPayload(payload);
                break;
              }
            }
          } catch {
          }
        }
        this.updateStatus('connected');
      }
    } catch {
    }
  }

  private startCloudPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.fetchLatestCloudState();
    }, 4500);
  }

  private handleIncomingPayload(payload: SyncPayload) {
    if (!payload) return;
    if (payload.originId === this.clientId) return;

    if (payload.version && payload.version <= this.lastKnownVersion) {
      return;
    }

    if (payload.version) {
      this.lastKnownVersion = payload.version;
    }

    this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.updateStatus('connected');

    this.notifyListeners(payload);
  }

  public subscribe(callback: SyncCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeStatus(callback: StatusCallback) {
    this.statusListeners.add(callback);
    callback(this.connectionStatus, this.lastSyncTime);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private updateStatus(status: 'connected' | 'syncing' | 'offline') {
    this.connectionStatus = status;
    this.statusListeners.forEach(cb => {
      try {
        cb(status, this.lastSyncTime);
      } catch {
      }
    });
  }

  private notifyListeners(payload: SyncPayload) {
    this.listeners.forEach(cb => {
      try {
        cb(payload);
      } catch (err) {
        console.error('Error in sync callback:', err);
      }
    });
  }

  public async pushUpdate(payload: SyncPayload) {
    const version = Date.now();
    this.lastKnownVersion = version;
    this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const enriched: SyncPayload = {
      ...payload,
      version,
      originId: this.clientId,
      sourceDevice: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'PC') : 'Unknown',
      timestamp: new Date().toISOString()
    };

    try {
      this.broadcastChannel?.postMessage({ state: enriched });
    } catch {
    }

    if (!this.isPublishing) {
      this.isPublishing = true;
      this.updateStatus('syncing');

      try {
        await fetch(GLOBAL_CLOUD_TOPIC, {
          method: 'POST',
          headers: {
            'Title': 'JAC_T9_SYNC',
            'Priority': '3'
          },
          body: JSON.stringify(enriched)
        });
        this.updateStatus('connected');
      } catch (err) {
        console.warn('Cloud relay publish error:', err);
      } finally {
        this.isPublishing = false;
      }
    }

    try {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('run.app'))) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enriched)
        }).catch(() => {});
      }
    } catch {
    }
  }

  public async syncToFirebase(payload: SyncPayload) {
    try {
      const docRef = doc(db, 'sync', 'latest');
      await setDoc(docRef, {
        ...payload,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Firebase sync error:', err);
    }
  }

  public subscribeToFirebase(callback: SyncCallback) {
    const docRef = doc(db, 'sync', 'latest');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SyncPayload;
        if (data.originId !== this.clientId) {
          this.handleIncomingPayload(data);
        }
      }
    });
  }

  public async forceSyncNow(currentState?: SyncPayload) {
    this.updateStatus('syncing');
    if (currentState) {
      await this.pushUpdate(currentState);
    }
    await this.fetchLatestCloudState();
    this.updateStatus('connected');
  }
}

export const realtimeSync = new RealtimeSyncManager();
export const API_BASE_URL = '';
