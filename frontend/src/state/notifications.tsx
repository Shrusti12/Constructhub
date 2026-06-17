import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "./auth";

export type Notifications = {
  pending_connections: number;
  unread_by_connection: Record<number, number>;
};

type NotificationsState = {
  notifications: Notifications | null;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notifications | null>(null);

  const refresh = async () => {
    if (!token || !user) {
      setNotifications(null);
      return;
    }
    const res = await api.get<Notifications>("/market/notifications", token);
    setNotifications(res);
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!canceled) setNotifications(null);
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  useEffect(() => {
    const t = setInterval(() => {
      refresh().catch(() => {});
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const value = useMemo(() => ({ notifications, refresh }), [notifications]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("NotificationsProvider missing");
  return ctx;
}

