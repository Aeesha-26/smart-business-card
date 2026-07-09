import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, CreditCard, Scan, MessageSquare } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalUsers: number;
  totalCards: number;
  totalScans: number;
  totalFeedback: number;
}

interface RecentUser {
  full_name: string;
  created_at: string;
}

interface ScanDay {
  date: string;
  scans: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCards: 0, totalScans: 0, totalFeedback: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [scanData, setScanData] = useState<ScanDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersRes, cardsRes, scansRes, feedbackRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("business_cards").select("*", { count: "exact", head: true }),
        supabase.from("scan_logs").select("*", { count: "exact", head: true }),
        supabase.from("feedback").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalCards: cardsRes.count || 0,
        totalScans: scansRes.count || 0,
        totalFeedback: feedbackRes.count || 0,
      });

      // Recent users
      const { data: users } = await supabase
        .from("profiles")
        .select("full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentUsers(users || []);

      // Scan chart data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: scans } = await supabase
        .from("scan_logs")
        .select("scanned_at")
        .gte("scanned_at", thirtyDaysAgo.toISOString())
        .order("scanned_at", { ascending: true });

      // Group by day
      const dayMap: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        dayMap[d.toISOString().split("T")[0]] = 0;
      }
      (scans || []).forEach((s) => {
        const day = s.scanned_at.split("T")[0];
        if (dayMap[day] !== undefined) dayMap[day]++;
      });
      setScanData(Object.entries(dayMap).map(([date, scans]) => ({
        date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
        scans,
      })));

      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-blue-500" },
    { icon: CreditCard, label: "Total Cards", value: stats.totalCards, color: "text-accent" },
    { icon: Scan, label: "Total Scans", value: stats.totalScans, color: "text-purple-500" },
    { icon: MessageSquare, label: "Feedback", value: stats.totalFeedback, color: "text-amber-500" },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      {loading ? (
        <div className="text-muted-foreground">Loading dashboard data...</div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="font-heading text-2xl font-bold">{s.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts + Recent Activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Scan Chart */}
            <div className="lg:col-span-2 card-elevated p-6">
              <h2 className="font-heading text-lg font-semibold mb-4">Scan Activity (30 Days)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scanData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="scans" stroke="#2d9c83" strokeWidth={2} fill="#2d9c83" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Users */}
            <div className="card-elevated p-6">
              <h2 className="font-heading text-lg font-semibold mb-4">Recent Users</h2>
              <div className="space-y-3">
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users yet</p>
                ) : (
                  recentUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{u.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
