import { useState } from "react";
import { BookUser, Download, Smartphone, CheckCircle2, X, Trash2, RefreshCw } from "lucide-react";

interface SaveContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPhonebook: () => void;
  onRemoveFromPhonebook: () => void;
  onDownloadToDevice: () => void;
  contactName: string;
  isAlreadySaved: boolean;
  accentColor: string;
  primaryColor: string;
}

export default function SaveContactSheet({
  isOpen,
  onClose,
  onSaveToPhonebook,
  onRemoveFromPhonebook,
  onDownloadToDevice,
  contactName,
  isAlreadySaved,
  accentColor,
  primaryColor,
}: SaveContactSheetProps) {
  const [selected, setSelected] = useState<"phonebook" | "device">("phonebook");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [doneLabel, setDoneLabel] = useState("Saved!");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    if (selected === "phonebook") {
      onSaveToPhonebook();
      setDoneLabel(isAlreadySaved ? "Updated!" : "Saved!");
    } else {
      onDownloadToDevice();
      setDoneLabel("Downloading…");
    }
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 1200);
  };

  const handleRemove = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    onRemoveFromPhonebook();
    setSaving(false);
    setDoneLabel("Removed!");
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.2s ease" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <div className="bg-card rounded-t-3xl shadow-2xl overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="px-6 pt-3 pb-4 flex items-start justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight">Save Contact</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAlreadySaved ? (
                  <>
                    <span
                      className="inline-flex items-center gap-1 font-medium"
                      style={{ color: accentColor }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {contactName} is in your phonebook
                    </span>
                  </>
                ) : (
                  <>
                    Choose how to save{" "}
                    <span className="font-medium text-foreground">{contactName}</span>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Already saved state */}
          {isAlreadySaved ? (
            <div className="px-5 pb-3 space-y-3">
              {/* Re-save (update) option */}
              <button
                onClick={() => setSelected("phonebook")}
                className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden"
                style={{
                  borderColor: selected === "phonebook" ? accentColor : "transparent",
                  backgroundColor:
                    selected === "phonebook" ? `${accentColor}10` : "var(--muted)",
                }}
              >
                {selected === "phonebook" && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        selected === "phonebook"
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : "var(--background)",
                    }}
                  >
                    <RefreshCw
                      className="h-5 w-5"
                      style={{ color: selected === "phonebook" ? "white" : accentColor }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Update in Phonebook</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Refresh the saved contact with the latest information.
                    </p>
                  </div>
                </div>
              </button>

              {/* Download to device option */}
              <button
                onClick={() => setSelected("device")}
                className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden"
                style={{
                  borderColor: selected === "device" ? accentColor : "transparent",
                  backgroundColor:
                    selected === "device" ? `${accentColor}10` : "var(--muted)",
                }}
              >
                {selected === "device" && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        selected === "device"
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : "var(--background)",
                    }}
                  >
                    <Smartphone
                      className="h-5 w-5"
                      style={{ color: selected === "device" ? "white" : accentColor }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Download to Device</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Downloads a <strong>.vcf</strong> file for your native contacts app.
                    </p>
                  </div>
                </div>
              </button>

              {/* Remove option */}
              <button
                onClick={handleRemove}
                disabled={saving || done}
                className="w-full h-10 rounded-xl border-2 border-destructive/30 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove from Phonebook
              </button>
            </div>
          ) : (
            /* Fresh save options */
            <div className="px-5 pb-3 space-y-3">
              {/* Option 1: App Phonebook (default) */}
              <button
                onClick={() => setSelected("phonebook")}
                className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden"
                style={{
                  borderColor: selected === "phonebook" ? accentColor : "transparent",
                  backgroundColor:
                    selected === "phonebook" ? `${accentColor}10` : "var(--muted)",
                }}
              >
                {selected === "phonebook" && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background:
                        selected === "phonebook"
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : "var(--background)",
                    }}
                  >
                    <BookUser
                      className="h-5 w-5"
                      style={{ color: selected === "phonebook" ? "white" : accentColor }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                      CardSync Phonebook
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        DEFAULT
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Save inside this app. Access anytime — no file downloaded to your device.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Device download */}
              <button
                onClick={() => setSelected("device")}
                className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden"
                style={{
                  borderColor: selected === "device" ? accentColor : "transparent",
                  backgroundColor:
                    selected === "device" ? `${accentColor}10` : "var(--muted)",
                }}
              >
                {selected === "device" && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background:
                        selected === "device"
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : "var(--background)",
                    }}
                  >
                    <Smartphone
                      className="h-5 w-5"
                      style={{ color: selected === "device" ? "white" : accentColor }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Download to Device</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Downloads a <strong>.vcf</strong> file that your phone opens in its native Contacts app.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Confirm button */}
          <div className="px-5 pb-8 pt-2">
            <button
              onClick={handleConfirm}
              disabled={saving || done}
              className="w-full h-12 rounded-2xl font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              style={{
                background: done
                  ? doneLabel === "Removed!" ? "#dc2626" : "#16a34a"
                  : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                opacity: saving ? 0.8 : 1,
              }}
            >
              {done ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {doneLabel}
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing…
                </>
              ) : selected === "phonebook" ? (
                <>
                  {isAlreadySaved ? <RefreshCw className="h-4 w-4" /> : <BookUser className="h-4 w-4" />}
                  {isAlreadySaved ? "Update Contact" : "Save to CardSync Phonebook"}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download .vcf File
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
