import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { X, Download, Copy, Check } from "lucide-react";

interface QrModalProps {
  cardId: string;
  onClose: () => void;
}

export default function QrModal({ cardId, onClose }: QrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    const load = async () => {
      // Get card public_id
      const { data: card } = await supabase
        .from("business_cards")
        .select("public_id")
        .eq("id", cardId)
        .single();
      if (!card) return;

      const url = `${window.location.origin}/card/${card.public_id}`;
      setShareUrl(url);

      // Generate QR
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#1a365d" } });
      setQrDataUrl(dataUrl);

      // Ensure QR code record exists
      const { data: existingQr } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("card_id", cardId)
        .limit(1);

      let qrId: string | null = null;
      if (existingQr && existingQr.length > 0) {
        qrId = existingQr[0].id;
      } else {
        const { data: newQr } = await supabase
          .from("qr_codes")
          .insert({ card_id: cardId, qr_string: url, qr_type: "dynamic" })
          .select()
          .single();
        qrId = newQr?.id || null;
      }

      // Get scan analytics
      if (qrId) {
        const { count } = await supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("qr_id", qrId);
        setTotalScans(count || 0);

        const { data: scans } = await supabase
          .from("scan_logs")
          .select("scanned_at")
          .eq("qr_id", qrId)
          .order("scanned_at", { ascending: false })
          .limit(5);
        setRecentScans((scans || []).map(s => s.scanned_at));
      }
    };
    load();
  }, [cardId]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center px-4" onClick={onClose}>
      <div className="card-elevated w-full max-w-sm p-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-heading text-xl font-bold mb-4 text-center">QR Code</h2>
        
        {qrDataUrl && (
          <div className="flex justify-center mb-4">
            <img src={qrDataUrl} alt="QR Code" className="rounded-lg" />
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <Button onClick={handleDownload} className="flex-1 gap-2" size="sm">
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2" size="sm">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy URL"}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-2">Scan Analytics</h3>
          <p className="text-sm text-muted-foreground mb-2">Total scans: <span className="font-semibold text-foreground">{totalScans}</span></p>
          {recentScans.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recent scans:</p>
              {recentScans.map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {new Date(s).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
