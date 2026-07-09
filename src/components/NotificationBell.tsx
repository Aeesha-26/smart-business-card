import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bell, Check, Scan, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "scan": return <Scan className="h-4 w-4 text-accent" />;
      case "feedback": return <MessageSquare className="h-4 w-4 text-primary" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
  <div className="fixed top-16 right-0 overflow-y-auto bg-card border rounded-xl shadow-lg z-50 animate-slide-down" style={{ width: 'min(320px, calc(100vw - 1rem))', maxHeight: '70vh' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-heading font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                      !n.read ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-normal break-words">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}