import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./api";

const wsUrlFromApiBase = () => {
  try {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/dashboard";
    url.search = "";
    return url.toString();
  } catch {
    return "ws://localhost:8000/ws/dashboard";
  }
};

// Connects to the backend's /ws/dashboard socket and invokes onEvent for
// every {type, data} message it pushes (telemetry_update, new_alert,
// rental_checkout, rental_checkin). Auto-reconnects with backoff.
export function useDashboardSocket(onEvent) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let socket;
    let retryTimeout;
    let retryDelay = 1500;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      socket = new WebSocket(wsUrlFromApiBase());

      socket.onopen = () => {
        setConnected(true);
        retryDelay = 1500;
      };
      socket.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          handlerRef.current?.(msg);
        } catch {
          /* ignore malformed frame */
        }
      };
      socket.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          retryTimeout = setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 1.5, 15000);
        }
      };
      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimeout);
      socket?.close();
    };
  }, []);

  return { connected };
}
