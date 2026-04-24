"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  TRADE_ACCEPTED:       "🤝",
  TRADE_DECLINED:       "❌",
  TRADE_DEPOSIT:        "💳",
  TRADE_CARD_SENT:      "📦",
  TRADE_COMPLETED:      "🎉",
  TRADE_CONFIRM_PENDING:"✅",
  FRIEND_REQUEST:       "👋",
  FRIEND_ACCEPTED:      "🫂",
  RECOMMENDATION:       "⭐",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = notifications.filter((n) => !n.read).length;

  async function load() {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }

  async function markRead() {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      credentials: "include",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // Poll every 30 s
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle() {
    if (!open) markRead();
    setOpen((o) => !o);
  }

  function handleClick(n: Notification) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={toggle}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 transition"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={markRead}
                className="text-xs text-pink-500 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 items-start ${
                    !n.read ? "bg-pink-50/60" : ""
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5 flex-shrink-0">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
