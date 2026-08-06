/**
 * WebSocket URL + low-level client helpers for online play.
 */

/** @returns {string} */
export function getOnlineWsUrl() {
  const envUrl = import.meta.env.VITE_ONLINE_WS_URL;
  if (envUrl && typeof envUrl === "string") return envUrl;

  if (typeof window === "undefined") return "ws://127.0.0.1:8787/ws";

  const { protocol, host } = window.location;
  if (protocol === "http:" || protocol === "https:") {
    const wsProto = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${host}/ws`;
  }
  return "ws://127.0.0.1:8787/ws";
}

/**
 * @param {string} url
 * @param {{
 *   onOpen?: () => void,
 *   onClose?: () => void,
 *   onMessage?: (data: object) => void,
 *   onError?: (err: Event) => void,
 * }} handlers
 */
export function connectOnlineSocket(url, handlers) {
  const socket = new WebSocket(url);

  socket.addEventListener("open", () => handlers.onOpen?.());
  socket.addEventListener("close", () => handlers.onClose?.());
  socket.addEventListener("error", (e) => handlers.onError?.(e));
  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && typeof data === "object") handlers.onMessage?.(data);
    } catch {
      /* ignore bad frames */
    }
  });

  return socket;
}

/** @param {WebSocket} socket @param {object} msg */
export function sendOnlineMessage(socket, msg) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(msg));
  return true;
}
