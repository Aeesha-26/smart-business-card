import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QrCode, BookUser, Search, Trash2, Phone, Mail, Globe, MapPin, ExternalLink, ArrowLeft, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPhonebook, removeFromPhonebook, SavedContact } from "@/lib/phonebook";
import { useAuth } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import { Settings, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Phonebook() {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const refresh = () => setContacts(getPhonebook());

  useEffect(() => {
    refresh();
  }, []);

  const handleRemove = (id: string) => {
    removeFromPhonebook(id);
    refresh();
    if (expanded === id) setExpanded(null);
  };

  const filtered = contacts.filter((c) =>
    [c.name, c.organization, c.job_title, c.email, c.phone]
      .filter(Boolean)
      .some((val) => val!.toLowerCase().includes(search.toLowerCase()))
  );

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
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <BookUser className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">My Phonebook</h1>
            <p className="text-sm text-muted-foreground">
              {contacts.length} saved contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        {contacts.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
            />
          </div>
        )}

        {/* Empty state */}
        {contacts.length === 0 && (
          <div className="card-elevated p-12 text-center">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">No contacts yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Contacts you save from digital business cards will appear here.
            </p>
          </div>
        )}

        {/* No results */}
        {contacts.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No contacts match "<strong>{search}</strong>"
          </div>
        )}

        {/* Contact list */}
        <div className="space-y-3">
          {filtered.map((contact) => {
            const isOpen = expanded === contact.id;
            return (
              <div key={contact.id} className="card-elevated overflow-hidden">
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : contact.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/40 transition-colors"
                >
                  {/* Avatar */}
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url}
                      alt={contact.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-accent/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold font-heading text-lg flex-shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{contact.name}</p>
                    {(contact.job_title || contact.organization) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {[contact.job_title, contact.organization].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(contact.savedAt).toLocaleDateString("en", { day: "numeric", month: "short" })}
                    </span>
                    <svg
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t space-y-3 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
                        >
                          <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-sm truncate">{contact.phone}</span>
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
                        >
                          <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-sm truncate">{contact.email}</span>
                        </a>
                      )}
                      {contact.website && (
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
                        >
                          <Globe className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-sm truncate">{contact.website}</span>
                        </a>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/60">
                          <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-sm truncate">{contact.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Social links */}
                    {(contact.linkedin_url || contact.instagram_url || contact.twitter_url) && (
                      <div className="flex gap-2 flex-wrap">
                        {contact.linkedin_url && (
                          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                            <ExternalLink className="h-3 w-3" /> LinkedIn
                          </a>
                        )}
                        {contact.instagram_url && (
                          <a href={contact.instagram_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-600 text-xs font-medium hover:bg-pink-500/20 transition-colors">
                            <ExternalLink className="h-3 w-3" /> Instagram
                          </a>
                        )}
                        {contact.twitter_url && (
                          <a href={contact.twitter_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 text-xs font-medium hover:bg-sky-500/20 transition-colors">
                            <ExternalLink className="h-3 w-3" /> X / Twitter
                          </a>
                        )}
                      </div>
                    )}

                    {/* Remove */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleRemove(contact.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove contact
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
