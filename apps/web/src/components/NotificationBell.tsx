import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '../api/notifications';

const POLL_MS = 30000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;

  return new Date(iso).toLocaleDateString("es");
}

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await getUnreadCount());
    } catch {
      // Si falla el contador no molestamos al usuario con un error
    }
  }, []);

  const loadPanel = useCallback(async () => {
    try {
      const data = await getNotifications();
      setItems(data);
      setUnread(data.filter((n) => !n.read).length);
    } catch {
      setItems([]);
    }
  }, []);

  // Polling del contador cada 30s
  useEffect(() => {
    // Diferido un tick para no provocar un render en cascada al montar
    const initial = setTimeout(() => {
      void refreshCount();
    }, 0);

    const timer = setInterval(() => {
      void refreshCount();
    }, POLL_MS);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refreshCount]);

  // Refresca al volver a la pestaña o al enfocar la ventana
  useEffect(() => {
    const onFocus = () => {
      void refreshCount();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refreshCount]);

  // Cierra el panel al hacer click fuera
  useEffect(() => {
    if (!open) return;

    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadPanel();
  };

  const handleOpenItem = async (notification: AppNotification) => {
    setOpen(false);

    if (!notification.read) {
      setUnread((prev) => Math.max(prev - 1, 0));
      setItems((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      try {
        await markNotificationAsRead(notification._id);
      } catch {
        void refreshCount();
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await markAllNotificationsAsRead();
    } catch {
      void refreshCount();
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={togglePanel}
        aria-label="Notificaciones"
        className="relative flex items-center justify-center w-10 h-10 rounded-lg text-butter-100 hover:bg-butter-400/30 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-xl shadow-xl border border-butter-200 z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-butter-200">
            <span className="font-bold text-gray-800">Notificaciones</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-bold text-butter-500 hover:underline cursor-pointer"
              >
                Marcar todas
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">
                No tienes notificaciones.
              </li>
            ) : (
              items.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => void handleOpenItem(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-butter-100/60 transition-colors flex gap-3 ${
                      notification.read ? "" : "bg-butter-100/40"
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        notification.read ? "bg-transparent" : "bg-butter-500"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-gray-800 break-words">
                        {notification.message}
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
