import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Palette, ChevronDown, ChevronUp } from "lucide-react";

const DEFAULT_VISIBLE = {
  phone: true, email: true, website: true, address: true,
  linkedin_url: true, instagram_url: true, twitter_url: true,
};

const DEFAULT_THEME = {
  primaryColor: "#1a365d",
  accentColor: "#2d9c83",
  backgroundColor: "#f8fafc",
};

export default function CardForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  const [form, setForm] = useState({
    name: "", job_title: "", organization: "", phone: "", email: "",
    website: "", address: "", linkedin_url: "", instagram_url: "", twitter_url: "",
    status: "active",
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    if (isEdit) {
      supabase.from("business_cards").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { navigate("/dashboard"); return; }
        setForm({
          name: data.name, job_title: data.job_title || "", organization: data.organization || "",
          phone: data.phone || "", email: data.email || "", website: data.website || "",
          address: data.address || "", linkedin_url: data.linkedin_url || "",
          instagram_url: data.instagram_url || "", twitter_url: data.twitter_url || "",
          status: data.status,
        });
        setAvatarUrl(data.avatar_url || null);
        const th = data.theme;
        if (typeof th === "object" && th !== null) setTheme(th as typeof DEFAULT_THEME);
        // If any extra fields are filled, expand the section
        const d = data;
        if (d.organization || d.website || d.address || d.linkedin_url || d.instagram_url || d.twitter_url) {
          setShowMore(true);
        }
      });
    }
  }, [id]);

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Only allow digits, +, -, spaces, (, ) in phone field
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d+\-\s().]/g, "");
    setForm((prev) => ({ ...prev, phone: cleaned }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setLoading(true);

    const payload = {
      ...form,
      avatar_url: avatarUrl,
      visible_fields: DEFAULT_VISIBLE,
      theme,
    };

    if (isEdit) {
      const { error } = await supabase.from("business_cards").update(payload).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Card updated!" }); navigate("/dashboard"); }
    } else {
      const { data: card, error } = await supabase
        .from("business_cards")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (card) {
        const qrString = `${window.location.origin}/card/${card.public_id}`;
        await supabase.from("qr_codes").insert({
          card_id: card.id,
          qr_string: qrString,
          qr_type: "dynamic",
        });
        toast({ title: "Card created!" });
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="card-elevated p-8">
          <h1 className="font-heading text-2xl font-bold mb-6">{isEdit ? "Edit" : "Create"} Business Card</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4 pb-4 border-b">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-accent/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </div>
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
              </div>
            </div>

            {/* Core Fields */}
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={form.job_title}
                onChange={(e) => handleChange("job_title", e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => {
                  // Block letters and most special chars, allow: digits, +, -, space, (, ), Backspace, Delete, arrows, Tab
                  const allowed = /[\d+\-\s().]/;
                  if (
                    e.key.length === 1 &&
                    !allowed.test(e.key) &&
                    !e.ctrlKey && !e.metaKey
                  ) {
                    e.preventDefault();
                  }
                }}
                placeholder="+234 801 234 5678"
              />
              <p className="text-xs text-muted-foreground mt-1">Digits, +, -, spaces and brackets only</p>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            {/* Optional / Extra Fields */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full"
              >
                {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showMore ? "Hide" : "Add"} optional details
                <span className="text-xs text-muted-foreground ml-1">(organization, website, address, socials)</span>
              </button>

              {showMore && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" value={form.organization} onChange={(e) => handleChange("organization", e.target.value)} placeholder="Acme Inc." />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="url" value={form.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://example.com" />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="123 Main St, City" />
                  </div>
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input id="linkedin_url" type="url" value={form.linkedin_url} onChange={(e) => handleChange("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input id="instagram_url" type="url" value={form.instagram_url} onChange={(e) => handleChange("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <Label htmlFor="twitter_url">X / Twitter URL</Label>
                    <Input id="twitter_url" type="url" value={form.twitter_url} onChange={(e) => handleChange("twitter_url", e.target.value)} placeholder="https://x.com/..." />
                  </div>
                </div>
              )}
            </div>

            {/* Theme Customization Toggle */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowCustomization(!showCustomization)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Palette className="h-4 w-4" />
                {showCustomization ? "Hide" : "Customize"} Card Theme
              </button>

              {showCustomization && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="primaryColor" className="text-xs">Primary Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="primaryColor"
                          type="color"
                          value={theme.primaryColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{theme.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accentColor" className="text-xs">Accent Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="accentColor"
                          type="color"
                          value={theme.accentColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{theme.accentColor}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bgColor" className="text-xs">Background</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="bgColor"
                          type="color"
                          value={theme.backgroundColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{theme.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="rounded-lg h-10 flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {form.name || "Your Name"}
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Card" : "Create Card"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
