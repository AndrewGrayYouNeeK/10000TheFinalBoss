import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearOnlineLiveSession,
  defaultJoinVisibility,
  onlineWsUrl,
  writeOnlineLiveSession,
} from "@/lib/onlineClient";

/**
 * WebSocket match client for live online play.
 *
 * @param {{
 *   enabled: boolean,
 *   code: string|null,
 *   playerId: string|null,
 *   name: string,
 *   skinId?: string,
 *   trueSkinId?: string|null,
 *   visibility?: object,
 *   onToast?: (msg: string, variant?: string) => void,
 * }} opts
 */
export function useOnlineMatch({
  enabled,
  code,
  playerId,
  name,
  skinId = "classic_white",
  trueSkinId = null,
  visibility,
  onToast,
}) {
  const [status, setStatus] = useState("idle"); // idle|connecting|lobby|playing|finished|error
  const [error, setError] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [serverPayload, setServerPayload] = useState(null);
  const [viewerPlayerIndex, setViewerPlayerIndex] = useState(0);
  const [seq, setSeq] = useState(0);
  const [rollAnimMs, setRollAnimMs] = useState(0);
  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const visibilityRef = useRef(visibility || defaultJoinVisibility());
  const onToastRef = useRef(onToast);

  useEffect(() => {
    visibilityRef.current = visibility || defaultJoinVisibility();
  }, [visibility]);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const send = useCallback((obj) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(obj));
    return true;
  }, []);

  const sendAction = useCallback(
    (action, payload = {}) => send({ type: "action", action, payload }),
    [send]
  );

  const setReady = useCallback(() => send({ type: "ready" }), [send]);

  const syncVisibility = useCallback(
    (next) => {
      visibilityRef.current = next;
      send({ type: "set_visibility", visibility: next });
    },
    [send]
  );

  useEffect(() => {
    if (!enabled || !code || !playerId) {
      setStatus("idle");
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;

    const connect = () => {
      if (cancelled) return;
      setStatus((s) => (s === "playing" || s === "lobby" ? s : "connecting"));
      setError(null);

      const url = onlineWsUrl(code, { name, playerId, skinId, trueSkinId });
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        send({
          type: "join",
          name,
          skinId,
          trueSkinId,
          visibility: visibilityRef.current,
        });
      };

      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        if (msg.type === "welcome") {
          return;
        }

        if (msg.type === "joined") {
          setViewerPlayerIndex(msg.playerIndex ?? 0);
          writeOnlineLiveSession({
            code: msg.code || code,
            playerId: msg.playerId || playerId,
            viewerPlayerIndex: msg.playerIndex ?? 0,
          });
          setStatus(msg.status === "playing" ? "playing" : "lobby");
          return;
        }

        if (msg.type === "lobby") {
          setLobby(msg);
          if (msg.status === "playing") setStatus("playing");
          else if (msg.status === "finished") setStatus("finished");
          else setStatus("lobby");
          return;
        }

        if (msg.type === "match_state") {
          setServerPayload(msg.payload || null);
          setViewerPlayerIndex(msg.viewerPlayerIndex ?? 0);
          setSeq(msg.seq ?? 0);
          if (msg.rollAnimMs) setRollAnimMs(msg.rollAnimMs);
          else setRollAnimMs(0);
          setStatus(msg.status === "finished" ? "finished" : "playing");
          if (msg.toast && onToastRef.current) onToastRef.current(msg.toast, "success");
          return;
        }

        if (msg.type === "error") {
          setError(msg.error || "Online error");
          if (onToastRef.current) onToastRef.current(msg.error || "Online error", "warning");
          return;
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setStatus((s) => (s === "finished" ? s : "connecting"));
        const attempt = (reconnectRef.current += 1);
        const delay = Math.min(8000, 500 * 2 ** Math.min(attempt, 4));
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        /* onclose handles retry */
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [enabled, code, playerId, name, skinId, trueSkinId, send]);

  // Clear rollAnimMs after it elapses so UI can settle.
  useEffect(() => {
    if (!rollAnimMs) return undefined;
    const t = setTimeout(() => setRollAnimMs(0), rollAnimMs);
    return () => clearTimeout(t);
  }, [rollAnimMs, seq]);

  const leave = useCallback(() => {
    clearOnlineLiveSession();
    try {
      wsRef.current?.close();
    } catch {
      /* ignore */
    }
    setStatus("idle");
    setServerPayload(null);
    setLobby(null);
  }, []);

  return {
    status,
    error,
    lobby,
    serverPayload,
    viewerPlayerIndex,
    seq,
    rollAnimMs,
    sendAction,
    setReady,
    syncVisibility,
    leave,
    connected: status === "lobby" || status === "playing" || status === "finished",
  };
}
