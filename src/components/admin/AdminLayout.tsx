import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { QrCode, LayoutDashboard, Users, MessageSquare, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className="admin-sidebar hidden md:flex flex-col">
        <div className="px-5 py-5 border-b">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-heading text-sm font-bold">CardSync</span>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Admin</span>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${location.pathname === item.to ? "active" : ""}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-1 border-t pt-4">
          <button onClick={() => navigate("/dashboard")} className="sidebar-link w-full">
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            <span className="font-heading text-sm font-bold">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden bg-card border-b px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                location.pathname === item.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-6 animate-fade-in">{title}</h1>
          <div className="animate-slide-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
