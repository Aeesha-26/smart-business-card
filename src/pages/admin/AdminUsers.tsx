import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";

const MAX_ADMINS = 2;

interface UserRow {
  full_name: string;
  role: string;
  user_id: string;
  created_at: string;
  card_count: number;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("full_name, role, user_id, created_at")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    const usersWithCounts: UserRow[] = [];
    for (const p of profiles) {
      const { count } = await supabase
        .from("business_cards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", p.user_id);
      usersWithCounts.push({ ...p, card_count: count || 0 });
    }
    setUsers(usersWithCounts);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const adminCount = users.filter((u) => u.role === "admin").length;

  const handlePromote = async (targetUserId: string, targetName: string) => {
    if (adminCount >= MAX_ADMINS) {
      toast({
        title: "Admin limit reached",
        description: `Only ${MAX_ADMINS} admins are allowed. Demote an existing admin first.`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Promote "${targetName}" to admin?`)) return;

    setUpdating(targetUserId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("user_id", targetUserId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User promoted", description: `${targetName} is now an admin.` });
      await fetchUsers();
    }
    setUpdating(null);
  };

  const handleDemote = async (targetUserId: string, targetName: string) => {
    // Prevent demoting yourself
    if (targetUserId === user?.id) {
      toast({
        title: "Cannot demote yourself",
        description: "Ask the other admin to demote you.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Remove admin access from "${targetName}"?`)) return;

    setUpdating(targetUserId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "user" })
      .eq("user_id", targetUserId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin removed", description: `${targetName} is now a regular user.` });
      await fetchUsers();
    }
    setUpdating(null);
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="User Management">
      <div className="space-y-4">
        {/* Admin count indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            adminCount >= MAX_ADMINS
              ? "bg-amber-500/10 text-amber-600"
              : "bg-accent/10 text-accent"
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {adminCount} / {MAX_ADMINS} admins
          </div>
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? "No users match your search" : "No users registered yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Cards</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Joined</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium">{u.full_name}</span>
                            {u.user_id === user?.id && (
                              <span className="text-[10px] text-muted-foreground ml-1.5">(you)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.card_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "user" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            disabled={adminCount >= MAX_ADMINS || updating === u.user_id}
                            onClick={() => handlePromote(u.user_id, u.full_name)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {updating === u.user_id ? "..." : "Make Admin"}
                          </Button>
                        ) : u.user_id !== user?.id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs text-destructive hover:text-destructive"
                            disabled={updating === u.user_id}
                            onClick={() => handleDemote(u.user_id, u.full_name)}
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            {updating === u.user_id ? "..." : "Remove Admin"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
