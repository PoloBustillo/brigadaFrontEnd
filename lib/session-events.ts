/**
 * Session Events — lightweight pub/sub for cross-module auth signals.
 *
 * Used to decouple the API client (which handles token refresh) from the
 * AuthContext (which owns the in-memory user state).
 *
 * Usage:
 *   // Emitter side (API client):
 *   sessionEvents.emit('session:expired');
 *
 *   // Listener side (AuthContext):
 *   sessionEvents.on('session:expired', handleLogout);
 *   sessionEvents.off('session:expired', handleLogout);
 */

type SessionEvent = "session:expired";
type Handler = () => void;

class SessionEventEmitter {
  private listeners: Map<SessionEvent, Set<Handler>> = new Map();

  on(event: SessionEvent, handler: Handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: SessionEvent, handler: Handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: SessionEvent) {
    this.listeners.get(event)?.forEach((handler) => handler());
  }
}

export const sessionEvents = new SessionEventEmitter();
