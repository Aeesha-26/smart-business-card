import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { MessageSquare, X } from "lucide-react";

interface FeedbackRow {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  created_at: string;
  card_name: string;
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<FeedbackRow | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("feedback")
        .select("id, name, email, message, created_at, card_id")
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Get card names
      const rows: FeedbackRow[] = [];
      for (const f of data) {
        let cardName = "Unknown";
        if (f.card_id) {
          const { data: card } = await supabase
            .from("business_cards")
            .select("name")
            .eq("id", f.card_id)
            .single();
          if (card) cardName = card.name;
        }
        rows.push({ ...f, card_name: cardName });
      }
      setFeedback(rows);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AdminLayout title="Feedback Management">
      <div className="card-elevated overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No feedback submitted yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">From</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Message</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Card</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedMessage(f)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.name || "Anonymous"}</p>
                      {f.email && <p className="text-xs text-muted-foreground">{f.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {f.message.length > 80 ? `${f.message.slice(0, 80)}...` : f.message}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f.card_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message detail modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center px-4" onClick={() => setSelectedMessage(null)}>
          <div className="card-elevated w-full max-w-lg p-6 relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedMessage(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-lg font-bold mb-4">Feedback Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium">{selectedMessage.name || "Anonymous"}</p>
                {selectedMessage.email && <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">About card</p>
                <p className="font-medium">{selectedMessage.card_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Message</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
