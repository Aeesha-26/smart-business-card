import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle } from "lucide-react";

interface FeedbackFormProps {
  cardId: string;
}

export default function FeedbackForm({ cardId }: FeedbackFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);

    await supabase.from("feedback").insert({
      card_id: cardId,
      name: name.trim() || null,
      email: email.trim() || null,
      message: message.trim(),
    });

    setLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setExpanded(false);
      setName("");
      setEmail("");
      setMessage("");
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="mt-6 p-6 rounded-xl bg-accent/10 border border-accent/20 text-center animate-scale-in">
        <CheckCircle className="h-10 w-10 text-accent mx-auto mb-3" />
        <p className="font-heading font-semibold text-foreground">Thank you!</p>
        <p className="text-sm text-muted-foreground mt-1">Your feedback has been submitted.</p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-6 w-full p-4 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 text-sm"
      >
        <MessageSquare className="h-4 w-4" />
        Leave Feedback
      </button>
    );
  }

  return (
    <div className="mt-6 p-5 rounded-xl bg-muted/50 border animate-slide-up">
      <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-accent" />
        Share Your Feedback
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fb-name" className="text-xs">Name (optional)</Label>
            <Input
              id="fb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="fb-email" className="text-xs">Email (optional)</Label>
            <Input
              id="fb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="fb-message" className="text-xs">Message *</Label>
          <textarea
            id="fb-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts or suggestions..."
            required
            rows={3}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="gap-2 flex-1" disabled={loading || !message.trim()}>
            <Send className="h-3.5 w-3.5" />
            {loading ? "Sending..." : "Send Feedback"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
