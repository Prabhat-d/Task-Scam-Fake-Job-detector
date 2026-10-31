import { useEffect, useRef } from 'react';
import { getSocket } from '../socket/socket.js';

/**
 * Subscribe to a socket event for the lifetime of a component.
 * The handler is kept in a ref so callers don't need to memoise it.
 */
export function useSocketEvent(event, handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const fn = (payload) => ref.current?.(payload);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, [event]);
}
