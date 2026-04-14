import { useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../services/store/store";
import { socketService } from "../services/socket/socketService";
import { setConnected, updateUploadPermission } from "../services/features/socket/socketSlice";
import type { UploadPermissionChangedPayload } from "../services/features/socket/socketSlice";

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const socketConnected = useAppSelector((state) => state.socket.connected);
  const user = useAppSelector((state) => state.auth.user);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      return;
    }

    socketService.connect();

    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on("connect", () => {
      if (mountedRef.current) dispatch(setConnected(true));
    });

    socket.on("disconnect", () => {
      if (mountedRef.current) dispatch(setConnected(false));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [user, dispatch]);

  /** Join a class room to receive permission change events. */
  const joinClass = useCallback((classId: number) => {
    socketService.joinClass(classId);
  }, []);

  /** Leave a class room. */
  const leaveClass = useCallback((classId: number) => {
    socketService.leaveClass(classId);
  }, []);

  /** Join a presentation room. */
  const joinPresentation = useCallback((presentationId: number) => {
    socketService.joinPresentation(presentationId);
  }, []);

  /** Leave a presentation room. */
  const leavePresentation = useCallback((presentationId: number) => {
    socketService.leavePresentation(presentationId);
  }, []);

  /** Generic listen to a socket event, auto-cleaned up on unmount. */
  const on = useCallback(
    <T = unknown>(event: string, handler: (data: T) => void) => {
      const socket = socketService.getSocket();
      if (!socket) return;
      const wrapped = (data: T) => {
        if (mountedRef.current) handler(data);
      };
      socket.on(event, wrapped);
      return () => socket.off(event, wrapped);
    },
    []
  );

  return {
    connected: socketConnected,
    joinClass,
    leaveClass,
    joinPresentation,
    leavePresentation,
    on,
    socket: socketService,
  };
};

/** Hook: subscribe to class upload permission change events. */
export const useClassUploadPermission = (
  classId: number,
  onPermissionChange?: (isUploadEnabled: boolean) => void
) => {
  const dispatch = useAppDispatch();
  const { joinClass, leaveClass, on } = useSocket();

  useEffect(() => {
    if (!classId) return;
    joinClass(classId);

    const unwatch = on<UploadPermissionChangedPayload>(
      "class:upload-permission-changed",
      (payload) => {
        if (payload.classId === classId) {
          dispatch(updateUploadPermission(payload));
          onPermissionChange?.(payload.isUploadEnabled);
        }
      }
    );

    return () => {
      leaveClass(classId);
      unwatch?.();
    };
  }, [classId, joinClass, leaveClass, on, onPermissionChange, dispatch]);
};
