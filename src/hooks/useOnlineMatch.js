import { useCallback, useEffect, useState } from "react";
import {
  connectOnlineSocket,
  getOnlineWsUrl,
  sendOnlineMessage,
} from "@/lib/onlineClient";
import { readProfileOnlineVisibility } from "@/lib/onlineVisibility";

/**
 * Manages a live online match WebSocket connection.
 *
 * @param {{
 *   enabled: boolean,
 *   roomCode?: string|null,
 *   playerId?: string|null,
 *   playerName?: string,
 *   skinId?: string,
 *   disguiseSkinId?: string|null,
 *   mode?: "create"|"join"|"reconnect",
 * }} options
 */
export function useOnlineMatch({
  enabled,
  roomCode = null,
  playerId = null,
  playerName = "Player",
  skinId = "classic_white",
  disguiseSkinId = null,
  mode = "create",
}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [matchPayload, setMatchPayload] = useState(null);
  const [viewerState, setViewerState] = useState(null);
  const [seq, setSeq] = useState(0);
  const [joinedInfo, setJoinedInfo] = useState(null);

  const send = useCallback((msg) => {
    sendOnlineMessage(socketRef.current, msg);
  }, []);

  const sendAction = useCallback(
    (action, payload = {}) => {
      send({ type: "action", action, payload });
    },
    [send]
  );

  const syncVisibility = useCallback(
    (visibility) => {
      send({ type: "sync_visibility", visibility });
    },
    [send]
  );

  const startMatch = useCallback(() => {
    send({ type: "start_match" });
  }, [send]);

  useEffect(() => {
    if (!enabled) return undefined;

    const url = getOnlineWsUrl();
    const socket = connectOnlineSocket(url, {
      onOpen: () => {
        setConnected(true);
        setError(null);
        const visibility = readProfileOnlineVisibility();
        if (mode === "reconnect" && roomCode && playerId) {
          sendOnlineMessage(socket, {
            type: "reconnect",
            roomCode,
            playerId,
          });
        } else if (mode === "join" && roomCode) {
          sendOnlineMessage(socket, {
            type: "join_room",
            roomCode,
            playerName,
            skinId,
            disguiseSkinId,
            visibility,
          });
        } else {
          sendOnlineMessage(socket, {
            type: "create_room",
            playerName,
            skinId,
            disguiseSkinId,
            visibility,
          });
        }
      },
      onClose: () => {
        setConnected(false);
      },
      onError: () => {
        setError("Connection failed — is the online server running?");
      },
      onMessage: (data) => {
        if (data.type === "error") {
          setError(data.message || "Server error");
          return;
        }
        if (data.type === "joined" || data.type === "reconnected") {
          setJoinedInfo({
            roomCode: data.roomCode,
            playerId: data.playerId,
            playerIndex: data.playerIndex,
            isHost: data.isHost,
          });
          setError(null);
        }
        if (data.type === "room_state") {
          setRoomState(data);
          if (data.seq != null) setSeq(data.seq);
        }
        if (data.type === "match_state") {
          setMatchPayload(data.payload ?? null);
          setViewerState(data.state ?? null);
          if (data.seq != null) setSeq(data.seq);
          setRoomState((prev) => ({
            ...prev,
            status: "playing",
            roomCode: data.roomCode,
            matchId: data.matchId,
          }));
        }
      },
    });

    socketRef.current = socket;

    const ping = window.setInterval(() => {
      sendOnlineMessage(socket, { type: "ping" });
    }, 25000);

    return () => {
      window.clearInterval(ping);
      socket.close();
      socketRef.current = null;
    };
  }, [
    enabled,
    mode,
    roomCode,
    playerId,
    playerName,
    skinId,
    disguiseSkinId,
  ]);

  return {
    connected,
    error,
    roomState,
    matchPayload,
    viewerState,
    seq,
    joinedInfo,
    sendAction,
    syncVisibility,
    startMatch,
    send,
  };
}
