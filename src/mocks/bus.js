/** In-memory event bus shared by the mock REST handlers and the mock socket. */
const listeners = new Map();

export const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(fn);
  },
  off(event, fn) {
    listeners.set(event, (listeners.get(event) || []).filter((f) => f !== fn));
  },
  dispatch(event, payload) {
    (listeners.get(event) || []).forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[mock socket]', event, e);
      }
    });
  },
};
