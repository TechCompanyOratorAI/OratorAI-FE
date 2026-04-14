import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../constant/apiConfig";

const SOCKET_URL = BASE_URL.replace("/api/v1", "");
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 32000];

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualDisconnect = false;

  // Track rooms that should be joined so we can rejoin on reconnect
  private joinedClasses = new Set<number>();
  private joinedPresentations = new Set<number>();

  private getToken(): string | null {
    return localStorage.getItem("accessToken") || null;
  }

  /** Rejoin all previously-joined rooms after a reconnect. */
  private reJoinRooms() {
    if (!this.socket?.connected) return;

    this.joinedClasses.forEach((classId) => {
      this.socket!.emit("class:subscribe", { classId });
    });

    this.joinedPresentations.forEach((presentationId) => {
      this.socket!.emit("join:presentation", presentationId);
    });

    if (this.joinedClasses.size > 0 || this.joinedPresentations.size > 0) {
      console.log(
        `[SocketService] Rejoined rooms: classes=${[...this.joinedClasses]}, presentations=${[...this.joinedPresentations]}`,
      );
    }
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = this.getToken();
    if (!token) {
      console.warn("[SocketService] No token found, skipping connect");
      return null as unknown as Socket;
    }

    this.manualDisconnect = false;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: false,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("[SocketService] Connected:", this.socket?.id);
      this.reconnectAttempt = 0;
      // Rejoin all rooms after (re)connect
      this.reJoinRooms();
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("[SocketService] Disconnected:", reason);
      if (!this.manualDisconnect) {
        this.scheduleReconnect();
      }
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketService] Connection error:", err.message);
      if (!this.manualDisconnect) {
        this.scheduleReconnect();
      }
    });

    return this.socket;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    console.log(`[SocketService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.socket = null;
      this.connect();
    }, delay);
  }

  disconnect() {
    this.manualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    // Keep joined rooms so they rejoin on next connect (if user logs back in)
    // Clear them if you want a full reset on disconnect
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, handler: (...args: any[]) => void) {
    this.socket?.on(event, handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, handler?: (...args: any[]) => void) {
    this.socket?.off(event, handler);
  }

  /** Listen to ALL events (debug helper). */
  onAny(handler: (eventName: string, ...args: unknown[]) => void) {
    this.socket?.onAny(handler);
  }

  /** Remove global debug listener. */
  offAny(handler?: (eventName: string, ...args: unknown[]) => void) {
    this.socket?.offAny(handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }

  /**
   * Join a class room. Safe to call multiple times.
   * If already connected, emits immediately.
   * Room is tracked so it will be rejoined automatically on reconnect.
   */
  joinClass(classId: number) {
    this.joinedClasses.add(classId);
    if (this.socket?.connected) {
      this.socket.emit("class:subscribe", { classId });
    }
  }

  /**
   * Leave a class room and remove from tracked rooms.
   */
  leaveClass(classId: number) {
    this.joinedClasses.delete(classId);
    this.socket?.emit("class:unsubscribe", { classId });
  }

  /**
   * Join a presentation room. Safe to call multiple times.
   * If already connected, emits immediately.
   * Room is tracked so it will be rejoined automatically on reconnect.
   */
  joinPresentation(presentationId: number) {
    this.joinedPresentations.add(presentationId);
    console.log(`[SocketService] joinPresentation(${presentationId}) called. socket?.connected=${!!this.socket?.connected}`);
    if (this.socket?.connected) {
      console.log(`[SocketService] EMIT join:presentation ${presentationId} (already connected)`);
      this.socket.emit("join:presentation", presentationId);
    } else {
      console.log(`[SocketService] SKIP emit join:presentation ${presentationId} (not connected, will rejoin on connect)`);
    }
  }

  /**
   * Leave a presentation room and remove from tracked rooms.
   */
  leavePresentation(presentationId: number) {
    this.joinedPresentations.delete(presentationId);
    this.socket?.emit("leave:presentation", { presentationId });
  }
}

export const socketService = new SocketService();
