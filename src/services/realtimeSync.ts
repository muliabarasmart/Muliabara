// Realtime Synchronization Manager for Netlify <-> AI Studio <-> Phone <-> PC
export interface SyncPayload {
  records?: any[];
  vehicles?: any[];
  notifications?: any[];
  users?: any[];
  settings?: any;
  version?: number;
  originId?: string;
}

type SyncCallback = (payload: SyncPayload) => void;

// Resolve Cloud Sync API URL dynamically
const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  
  // If running on Netlify or external domain, connect to the primary AI Studio cloud backend
  if (host.includes('netlify.app') || (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('run.app'))) {
    return 'https://ais-dev-r47c3xp4sglxex2hlt3pd6-480239547630.asia-east1.run.app';
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  public isConnected = false;
  private clientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `client_${Date.now()}_${Math.random()}`;
  private lastKnownVersion = 0;
  private reconnectTimeout: any = null;
  private pollInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('jac_t9_ev_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.state) {
            const incoming = event.data.state as SyncPayload;
            if (incoming.originId === this.clientId) return;
            if (incoming.version && incoming.version <= this.lastKnownVersion) return;
            if (incoming.version) this.lastKnownVersion = incoming.version;
            this.notifyListeners(incoming);
          }
        };
      } catch {
        // BroadcastChannel fallback
      }

      this.connectSSE();
      this.startPolling();
    }
  }

  private connectSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      const streamUrl = `${API_BASE_URL}/api/stream`;
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.state) {
            const incoming = parsed.state as SyncPayload;
            if (incoming.originId === this.clientId) return;
            if (incoming.version && incoming.version <= this.lastKnownVersion) return;
            if (incoming.version) this.lastKnownVersion = incoming.version;
            this.notifyListeners(incoming);
          }
        } catch {
          // heartbeat
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.eventSource?.close();
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connectSSE(), 6000);
      };
    } catch {
      this.isConnected = false;
    }
  }

  // Polling fallback to keep AI Studio and Netlify 100% in sync even if SSE reconnects
  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/state`);
        if (res.ok) {
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            const serverState = await res.json();
            if (serverState && serverState.version && serverState.version > this.lastKnownVersion) {
              this.lastKnownVersion = serverState.version;
              this.notifyListeners(serverState);
            }
          }
        }
      } catch {
        // offline / silent
      }
    }, 4000);
  }

  public subscribe(callback: SyncCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(payload: SyncPayload) {
    this.listeners.forEach(cb => {
      try {
        cb(payload);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  // Push updates to server and broadcast across Netlify, Google AI Studio, Phone & PC
  public async pushUpdate(payload: SyncPayload) {
    const version = Date.now();
    this.lastKnownVersion = version;

    const enriched: SyncPayload = {
      ...payload,
      version,
      originId: this.clientId
    };

    // 1. Broadcast locally to all open browser tabs
    try {
      this.broadcastChannel?.postMessage({ state: enriched });
    } catch {
      // ignore
    }

    // 2. Send to backend server to broadcast via SSE & polling to Netlify and all devices
    try {
      await fetch(`${API_BASE_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched)
      });
    } catch (err) {
      console.warn('Realtime sync server unreachable, local state preserved:', err);
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
