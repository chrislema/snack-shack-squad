import { Link, useLocation } from "react-router-dom";
import { Search, ListChecks, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  onCreate?: () => void;
}

export default function AppShell({ children, onCreate }: { children: React.ReactNode } & Props) {
  const location = useLocation();
  const isMine = location.pathname.startsWith("/mine");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 bg-gradient-hero text-primary-foreground shadow-elevated">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight">⚾ I Got This</Link>
          <div className="flex items-center gap-1">
            {onCreate && (
              <Button size="sm" variant="secondary" onClick={onCreate} className="gap-1">
                <Plus className="h-4 w-4" /> New
              </Button>
            )}
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/10"
              onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t safe-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-2">
          <NavTab to="/" icon={<Search className="h-5 w-5" />} label="Discover" active={!isMine} />
          <NavTab to="/mine" icon={<ListChecks className="h-5 w-5" />} label="My Tasks" active={isMine} />
        </div>
      </nav>
    </div>
  );
}

function NavTab({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link to={to} className={cn(
      "flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    )}>
      {icon}
      {label}
    </Link>
  );
}
