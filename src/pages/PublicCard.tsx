import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Globe, MapPin, Linkedin, Instagram, Twitter, UserPlus, BookUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadVCard } from "@/lib/vcard";
import { saveToPhonebook, isContactSaved, removeFromPhonebook } from "@/lib/phonebook";
import SaveContactSheet from "@/components/SaveContactSheet";
import FeedbackForm from "@/components/FeedbackForm";

interface CardData {
  id: string;
  name: string;
  job_title: string | null;
  organization: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  avatar_url: string | null;
  visible_fields: Record<string, boolean>;
  theme: { primaryColor: string; accentColor: string; backgroundColor: string };
}

export default function PublicCard() {
  const { publicId } = useParams();
  const [card, setCard] = useState<CardData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => {
    if (!publicId) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("business_cards")
        .select("id, name, job_title, organization, phone, email, website, address, linkedin_url, instagram_url, twitter_url, avatar_url, visible_fields, theme, status")
        .eq("public_id", publicId)
        .eq("status", "active")
        .single();

      if (error || !data) { setNotFound(true); return; }

      // Parse JSONB fields with defaults
      const visibleFields = (typeof data.visible_fields === "object" && data.visible_fields !== null)
        ? data.visible_fields as Record<string, boolean>
        : { phone: true, email: true, website: true, address: true, linkedin_url: true, instagram_url: true, twitter_url: true };

      const theme = (typeof data.theme === "object" && data.theme !== null)
        ? data.theme as { primaryColor: string; accentColor: string; backgroundColor: string }
        : { primaryColor: "#1a365d", accentColor: "#2d9c83", backgroundColor: "#f8fafc" };

      const cardData = { ...data, visible_fields: visibleFields, theme };
      setCard(cardData);
      setAlreadySaved(isContactSaved(data.id));

      // Log scan
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("card_id", data.id)
        .limit(1);

      if (qrData && qrData.length > 0) {
        await supabase.from("scan_logs").insert({ qr_id: qrData[0].id });
      }
    };
    load();
  }, [publicId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Card Not Found</h1>
          <p className="text-muted-foreground mb-6">This business card doesn't exist or is inactive.</p>
          <Button asChild><Link to="/">Go to CardSync</Link></Button>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const vf = card.visible_fields;

  const contactItems: { icon: typeof Phone; label: string; value: string | null; href?: string; fieldKey: string; buttonLabel?: string }[] = [
    { icon: Phone, label: "Phone", value: card.phone, href: card.phone ? `tel:${card.phone}` : undefined, fieldKey: "phone", buttonLabel: "place a call" },
    { icon: Mail, label: "Email", value: card.email, href: card.email ? `mailto:${card.email}` : undefined, fieldKey: "email", buttonLabel: "send a email" },
    { icon: Globe, label: "Website", value: card.website, href: card.website || undefined, fieldKey: "website", buttonLabel: "visit organzation website" },
    { icon: MapPin, label: "Address", value: card.address, fieldKey: "address" },
  ];

  const socialItems = [
    { icon: Linkedin, value: card.linkedin_url, label: "LinkedIn", fieldKey: "linkedin_url" },
    { icon: Instagram, value: card.instagram_url, label: "Instagram", fieldKey: "instagram_url" },
    { icon: Twitter, value: card.twitter_url, label: "X / Twitter", fieldKey: "twitter_url" },
  ];

  const visibleContacts = contactItems.filter((item) => item.value && vf[item.fieldKey] !== false);
  const visibleSocials = socialItems.filter((s) => s.value && vf[s.fieldKey] !== false);

  const getVCardData = () => {
    const vcardData: Record<string, string | null | undefined> = { name: card.name };
    if (vf.phone !== false) vcardData.phone = card.phone;
    if (vf.email !== false) vcardData.email = card.email;
    if (vf.website !== false) vcardData.website = card.website;
    if (vf.address !== false) vcardData.address = card.address;
    vcardData.job_title = card.job_title;
    vcardData.organization = card.organization;
    if (vf.linkedin_url !== false) vcardData.linkedin_url = card.linkedin_url;
    if (vf.instagram_url !== false) vcardData.instagram_url = card.instagram_url;
    if (vf.twitter_url !== false) vcardData.twitter_url = card.twitter_url;
    return vcardData;
  };

  const handleSaveToPhonebook = () => {
    saveToPhonebook({
      id: card.id,
      name: card.name,
      job_title: card.job_title,
      organization: card.organization,
      phone: vf.phone !== false ? card.phone : null,
      email: vf.email !== false ? card.email : null,
      website: vf.website !== false ? card.website : null,
      address: vf.address !== false ? card.address : null,
      linkedin_url: vf.linkedin_url !== false ? card.linkedin_url : null,
      instagram_url: vf.instagram_url !== false ? card.instagram_url : null,
      twitter_url: vf.twitter_url !== false ? card.twitter_url : null,
      avatar_url: card.avatar_url,
    });
    setAlreadySaved(true);
  };

  const handleRemoveFromPhonebook = () => {
    removeFromPhonebook(card.id);
    setAlreadySaved(false);
  };

  const handleDownloadToDevice = () => {
    downloadVCard(getVCardData() as any);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: card.theme.backgroundColor }}>
        <div className="w-full max-w-md">
          {/* Header */}
          <div
            className="rounded-t-2xl px-8 py-10 text-center relative"
            style={{ backgroundColor: card.theme.primaryColor }}
          >
            {card.avatar_url ? (
              <img
                src={card.avatar_url}
                alt={card.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/30 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 text-4xl font-bold text-white font-heading border-4 border-white/30 shadow-lg">
                {card.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="font-heading text-2xl font-bold text-white relative">{card.name}</h1>
            {card.job_title && <p className="text-white/80 mt-1 relative">{card.job_title}</p>}
            {card.organization && <p className="text-white/60 text-sm mt-1 relative">{card.organization}</p>}
          </div>

          {/* Contact Info */}
          <div className="bg-card rounded-b-2xl shadow-lg px-6 py-6 space-y-4">
            {/* Save Contact button */}
            <Button
              onClick={() => setSheetOpen(true)}
              className="w-full gap-2 h-11 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: alreadySaved
                  ? "linear-gradient(135deg, #16a34a, #22c55e)"
                  : `linear-gradient(135deg, ${card.theme.primaryColor}, ${card.theme.accentColor})`,
              }}
            >
              <BookUser className="h-4 w-4" />
              {alreadySaved ? "Saved to Phonebook ✓" : "Save Contact"}
            </Button>

            {visibleContacts.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${card.theme.accentColor}15` }}
                >
                  <item.icon className="h-5 w-5" style={{ color: card.theme.accentColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  {item.href ? (
                    <Button variant="outline" size="sm" className="mt-1 h-8 px-3 text-xs font-semibold" asChild>
                      <a
                        href={item.href}
                        {...(item.fieldKey === "website"
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {item.buttonLabel}
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            {visibleSocials.length > 0 && (
              <div className="flex gap-3 pt-4 border-t justify-center">
                {visibleSocials.map((s, i) => (
                  <a
                    key={i}
                    href={s.value!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.theme.accentColor}15` }}
                    title={s.label}
                  >
                    <s.icon className="h-5 w-5" style={{ color: card.theme.accentColor }} />
                  </a>
                ))}
              </div>
            )}

            {/* Feedback Form */}
            <FeedbackForm cardId={card.id} />

            {/* Create account CTA */}
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground mb-2">Want your own digital business card?</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline transition-colors"
                style={{ color: card.theme.accentColor }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create your free card
              </Link>
            </div>
          </div>

          {/* Powered by */}
          <p className="text-center text-[10px] text-muted-foreground mt-4 opacity-60">
            Powered by CardSync
          </p>
        </div>
      </div>

      {/* Save Contact Sheet */}
      <SaveContactSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaveToPhonebook={handleSaveToPhonebook}
        onRemoveFromPhonebook={handleRemoveFromPhonebook}
        onDownloadToDevice={handleDownloadToDevice}
        contactName={card.name}
        isAlreadySaved={alreadySaved}
        accentColor={card.theme.accentColor}
        primaryColor={card.theme.primaryColor}
      />
    </>
  );
}
