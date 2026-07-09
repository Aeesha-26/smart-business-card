import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { QrCode, Plus, Eye, Pencil, Trash2, BarChart3, LogOut, Settings, Shield, Scan, BookUser } from "lucide-react";
import { getPhonebook } from "@/lib/phonebook";
import { useToast } from "@/hooks/use-toast";
import QrModal from "@/components/QrModal";
import NotificationBell from "@/components/NotificationBell";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CardWithScans {
  id: string;
  public_id: string;
  name: string;
  job_title: string | null;
  organization: string | null;
  status: string;
  created_at: string;
  avatar_url: string | null;
  scan_count: number;
}

interface ScanDay {
  date: string;
  scans: number;
}

export default function Dashboard() {
  const { user, signOut, isAdmin, fullName } = useAuth();
  const [cards, setCards] = useState<CardWithScans[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCardId, setQrCardId] = useState<string | null>(null);
  const [totalScans, setTotalScans] = useState(0);
  const [scanChartData, setScanChartData] = useState<ScanDay[]>([]);
  const [phonebookCount, setPhonebookCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCards = async () => {
    if (!user) return;
    const { data: cardsData, error } = await supabase
      .from("business_cards")
      .select("id, public_id, name, job_title, organization, status, created_at, avatar_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    let allScans = 0;
    const cardsWithScans: CardWithScans[] = [];
    for (const card of cardsData || []) {
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("card_id", card.id)
        .limit(1);

      let scanCount = 0;
      if (qrData && qrData.length > 0) {
        const { count } = await supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("qr_id", qrData[0].id);
        scanCount = count || 0;
      }
      allScans += scanCount;
      cardsWithScans.push({ ...card, scan_count: scanCount });
    }
    setCards(cardsWithScans);
    setTotalScans(allScans);

    // Scan chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const allQrIds = (cardsData || []).map((c) => c.id);
    if (allQrIds.length > 0) {
      const { data: qrCodes } = await supabase
        .from("qr_codes")
        .select("id")
        .in("card_id", allQrIds);
      const qrIds = (qrCodes || []).map((q) => q.id);
      if (qrIds.length > 0) {
        const { data: scans } = await supabase
          .from("scan_logs")
          .select("scanned_at")
          .in("qr_id", qrIds)
          .gte("scanned_at", sevenDaysAgo.toISOString());
        const dayMap: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          dayMap[d.toISOString().split("T")[0]] = 0;
        }
        (scans || []).forEach((s) => {
          const day = s.scanned_at.split("T")[0];
          if (dayMap[day] !== undefined) dayMap[day]++;
        });
        setScanChartData(Object.entries(dayMap).map(([date, scans]) => ({
          date: new Date(date).toLocaleDateString("en", { weekday: "short" }),
          scans,
        })));
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchCards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);

  useEffect(() => {
    setPhonebookCount(getPhonebook().length);
  }, []);
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this card? This action cannot be undone.")) return;
    const { error } = await supabase.from("business_cards").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchCards();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Nav */}
     <nav className="bg-card border-b px-4 py-3">
  <div className="max-w-6xl mx-auto flex items-center justify-between">
    <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
      <QrCode className="h-6 w-6 text-accent" />
      <span className="font-heading text-lg font-bold">CardSync</span>
    </Link>
    <div className="flex items-center gap-1">
      <NotificationBell />
      {isAdmin && (
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-accent">
          <Link to="/admin"><Shield className="h-4 w-4" /> Admin</Link>
        </Button>
      )}
      <Button variant="ghost" size="sm" asChild className="gap-1.5">
        <Link to="/phonebook"><BookUser className="h-4 w-4" /> Phonebook</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/settings"><Settings className="h-4 w-4" /></Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  </div>
</nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome + Stats */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">
            Welcome back{fullName ? `, ${fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">Manage your digital business cards</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Total Cards</span>
            </div>
            <p className="font-heading text-2xl font-bold">{cards.length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Scan className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Total Scans</span>
            </div>
            <p className="font-heading text-2xl font-bold">{totalScans}</p>
          </div>
          <div className="stat-card col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Last 7 Days</span>
              </div>
            </div>
            {scanChartData.length > 0 ? (
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scanChartData}>
                    <Area type="monotone" dataKey="scans" stroke="#2d9c83" strokeWidth={2} fill="#2d9c83" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "6px" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
          <Link to="/phonebook" className="stat-card hover:ring-2 hover:ring-accent/30 transition-all col-span-2 md:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <BookUser className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Saved Contacts (Phonebook)</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-heading text-2xl font-bold">{phonebookCount}</p>
              <span className="text-xs text-accent font-medium">View Phonebook →</span>
            </div>
          </Link>
        </div>

        {/* Cards Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-semibold">My Business Cards</h2>
          <Button asChild className="gap-2">
            <Link to="/cards/new"><Plus className="h-4 w-4" /> New Card</Link>
          </Button>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => (
              <div key={i} className="card-elevated p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">No cards yet</h2>
            <p className="text-muted-foreground mb-6">Create your first digital business card</p>
            <Button asChild className="gap-2"><Link to="/cards/new"><Plus className="h-4 w-4" /> Create Card</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="card-elevated overflow-hidden"
              >
                {/* Mini hero header */}
                <div className="bg-primary px-6 py-4 flex items-center gap-3">
                  {card.avatar_url ? (
                    <img src={card.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                      {card.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm font-semibold text-white truncate">{card.name}</h3>
                    {card.job_title && <p className="text-xs text-white/70 truncate">{card.job_title}</p>}
                  </div>
                </div>

                <div className="p-5">
                  {card.organization && <p className="text-xs text-muted-foreground mb-3">{card.organization}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>{card.scan_count} scan{card.scan_count !== 1 ? "s" : ""}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                      card.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}>
                      {card.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild title="View">
                      <Link to={`/card/${card.public_id}`}><Eye className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild title="Edit">
                      <Link to={`/cards/${card.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQrCardId(card.id)} title="QR Code">
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(card.id)} title="Delete" className="ml-auto">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {qrCardId && <QrModal cardId={qrCardId} onClose={() => setQrCardId(null)} />}
    </div>
  );
}
