import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Shield, Trash2, AlertTriangle } from "lucide-react";

export default function Settings() {
  const { user, fullName, signOut, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newName, setNewName] = useState(fullName);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: newName.trim() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || !user) return;
    setDeleting(true);

    // Delete all user's business cards (cascades to qr_codes, scan_logs, feedback)
    await supabase.from("business_cards").delete().eq("user_id", user.id);
    // Delete notifications
    await supabase.from("notifications").delete().eq("user_id", user.id);
    // Delete profile
    await supabase.from("profiles").delete().eq("user_id", user.id);

    // Sign out
    await signOut();
    setDeleting(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile Section */}
        <div className="card-elevated p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label>Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium capitalize">{role}</span>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Profile"}
            </Button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="border-2 border-destructive/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible actions</p>
            </div>
          </div>

          {!deleteConfirm ? (
            <Button variant="destructive" onClick={() => setDeleteConfirm(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete Account
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-destructive/5 rounded-lg animate-slide-up">
              <p className="text-sm font-medium text-destructive">
                This will permanently delete your account and all associated data (cards, QR codes, scan history).
                This action cannot be undone.
              </p>
              <div>
                <Label htmlFor="deleteConfirm" className="text-sm">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="DELETE"
                  className="mt-1 max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== "DELETE" || deleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </Button>
                <Button variant="ghost" onClick={() => { setDeleteConfirm(false); setDeleteText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
