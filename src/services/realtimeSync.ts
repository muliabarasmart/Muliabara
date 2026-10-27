// Realtime Synchronization Manager for PC <-> Phone <-> Multi-tab
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

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  public isConnected = false;
  private clientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `client_${Date.now()}_${Math.random()}`;
  private lastKnownVersion = Date.now();
  private reconnectTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('jac_t9_ev_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.state) {
            const incoming = event.data.state as SyncPayload;
            // Ignore own broadcasts
            if (incoming.originId === this.clientId) return;
            if (incoming.version && incoming.version < this.lastKnownVersion) return;
            if (incoming.version) this.lastKnownVersion = incoming.version;
            this.notifyListeners(incoming);
          }
        };
      } catch {
        // BroadcastChannel fallback
      }

      this.connectSSE();
    }
  }

  private connectSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.state) {
            const incoming = parsed.state as SyncPayload;
            if (incoming.originId === this.clientId) return;
            if (incoming.version && incoming.version < this.lastKnownVersion) return;
            if (incoming.version) this.lastKnownVersion = incoming.version;
            this.notifyListeners(incoming);
          }
        } catch {
          // ignore keepalive/heartbeat
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.eventSource?.close();
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connectSSE(), 5000);
      };
    } catch {
      this.isConnected = false;
    }
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

  // Push updates to server and broadcast across all connected devices (Phone & PC)
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

    // 2. Send to backend server to broadcast via SSE to all other devices (Phones/PCs)
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched)
      });
    } catch (err) {
      console.warn('Realtime sync server offline, local state preserved:', err);
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
