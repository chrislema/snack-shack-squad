import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TaskCard from "@/components/TaskCard";
import TaskDetailSheet from "@/components/TaskDetailSheet";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskClaim } from "@/types/task";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Discover() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeLoc, setActiveLoc] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    const { data: t } = await supabase.from("tasks").select("*").neq("status", "complete").order("scheduled_at", { ascending: true, nullsFirst: false });
    const { data: c } = await supabase.from("task_claims").select("*");
    setTasks((t ?? []) as Task[]);
    setClaims((c ?? []) as TaskClaim[]);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const claimsByTask = useMemo(() => {
    const m: Record<string, TaskClaim[]> = {};
    for (const c of claims) (m[c.task_id] ??= []).push(c);
    return m;
  }, [claims]);

  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap((t) => t.tags))).sort(), [tasks]);
  const allLocations = useMemo(() => Array.from(new Set(tasks.map((t) => t.location).filter(Boolean) as string[])).sort(), [tasks]);

  const visible = tasks.filter((t) => {
    if (activeTag && !t.tags.includes(activeTag)) return false;
    if (activeLoc && t.location !== activeLoc) return false;
    if (q && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    const cnt = claimsByTask[t.id]?.length ?? 0;
    if (cnt >= t.volunteers_needed && !claimsByTask[t.id]?.some((c) => c.user_id === user?.id)) return false;
    return true;
  });

  if (!loading && !user) return <Navigate to="/auth" replace />;

  return (
    <AppShell onCreate={() => setCreateOpen(true)}>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Tasks to claim</h2>
          <p className="text-sm text-muted-foreground">Pick something you can help with.</p>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search tasks..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {(allTags.length > 0 || allLocations.length > 0) && (
          <div className="space-y-2">
            {allLocations.length > 0 && (
              <FilterRow label="Location" items={allLocations} active={activeLoc} onSelect={setActiveLoc} />
            )}
            {allTags.length > 0 && (
              <FilterRow label="Tag" items={allTags} active={activeTag} onSelect={setActiveTag} />
            )}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No open tasks match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                claimedCount={claimsByTask[t.id]?.length ?? 0}
                onClick={() => setOpenId(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      <TaskDetailSheet taskId={openId} open={!!openId} onOpenChange={(v) => !v && setOpenId(null)} onChanged={load} />
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </AppShell>
  );
}

function FilterRow({ label, items, active, onSelect }: { label: string; items: string[]; active: string | null; onSelect: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}:</span>
      {items.map((it) => {
        const isActive = active === it;
        return (
          <Badge
            key={it}
            variant={isActive ? "default" : "outline"}
            className={cn("cursor-pointer shrink-0", isActive && "bg-primary")}
            onClick={() => onSelect(isActive ? null : it)}
          >
            {it}
          </Badge>
        );
      })}
    </div>
  );
}
