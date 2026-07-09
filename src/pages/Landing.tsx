import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Share2, BarChart3, Smartphone, Shield, Palette, Download, ChevronRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <QrCode className="h-7 w-7 text-accent" />
          <span className="font-heading text-xl font-bold text-foreground">CardSync</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/register">Get Started</Link></Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground flex-1 flex items-center justify-center px-6 py-24 relative overflow-hidden">
        <div className="max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-8">
            Smart Digital Business Cards
          </div>

          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Professional Identity,{" "}
            <span className="text-accent">One Scan Away</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Create simple digital business cards with dynamic QR codes.
            Share your contact info instantly, track scans in real-time — no app needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/register" className="gap-2">
                Create Your Card Free <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Create, customize, and share your professional digital presence in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: "Create Your Card",
                desc: "Fill in your details — name, title, company, phone, email, socials, and more.",
              },
              {
                icon: QrCode,
                title: "Dynamic QR Code",
                desc: "A unique QR code is generated automatically. Download it, print it, share it anywhere.",
              },
              {
                icon: BarChart3,
                title: "Track Engagement",
                desc: "See who's viewing your card in real-time with detailed scan analytics and timestamps.",
              },
              {
                icon: Palette,
                title: "Customize Themes",
                desc: "Personalize your card with custom colors and themes that match your brand identity.",
              },
              {
                icon: Shield,
                title: "Privacy Controls",
                desc: "Choose exactly which information is visible. Hide or show any field with a toggle.",
              },
              {
                icon: Download,
                title: "vCard Download",
                desc: "Viewers can save your contact directly to their phone with one-tap vCard download.",
              },
            ].map((f, i) => (
              <div key={i} className="card-elevated p-7 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-accent mb-5">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground mb-12">Three simple steps to go digital</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free account in seconds" },
              { step: "2", title: "Build Your Card", desc: "Add your details, upload a photo, customize colors" },
              { step: "3", title: "Share & Track", desc: "Share your QR code and watch the analytics flow in" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-heading font-bold flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Button size="lg" asChild className="gap-2">
              <Link to="/register">Get Started Now <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            <span className="font-heading text-sm font-bold">CardSync</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} CardSync. Built as a final year project.
          </p>
        </div>
      </footer>
    </div>
  );
}
