import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TaskCard from "@/components/TaskCard";
import TaskDetailSheet from "@/components/TaskDetailSheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskClaim } from "@/types/task";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function MyTasks() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: c } = await supabase.from("task_claims").select("*").eq("user_id", user.id);
    const ids = (c ?? []).map((x: any) => x.task_id);
    setClaims((c ?? []) as TaskClaim[]);
    if (ids.length === 0) { setTasks([]); return; }
    const { data: t } = await supabase.from("tasks").select("*").in("id", ids);
    // also load all claims for these tasks for counts
    const { data: allClaims } = await supabase.from("task_claims").select("*").in("task_id", ids);
    setClaims((allClaims ?? []) as TaskClaim[]);
    setTasks((t ?? []) as Task[]);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const claimsByTask = useMemo(() => {
    const m: Record<string, TaskClaim[]> = {};
    for (const c of claims) (m[c.task_id] ??= []).push(c);
    return m;
  }, [claims]);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const myCompletedTaskIds = new Set(
    claims.filter((c) => c.user_id === user?.id && c.completed_at).map((c) => c.task_id)
  );
  const active = tasks.filter((t) => !myCompletedTaskIds.has(t.id));
  const done = tasks.filter((t) => myCompletedTaskIds.has(t.id));

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">My tasks</h2>
          <p className="text-sm text-muted-foreground">What you've signed up for.</p>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3 mt-4">
            {active.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nothing active. Head to Discover to grab one!</p>
            ) : active.map((t) => (
              <TaskCard key={t.id} task={t} claimedCount={claimsByTask[t.id]?.length ?? 0} onClick={() => setOpenId(t.id)} />
            ))}
          </TabsContent>
          <TabsContent value="done" className="space-y-3 mt-4">
            {done.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No completed tasks yet.</p>
            ) : done.map((t) => (
              <TaskCard key={t.id} task={t} claimedCount={claimsByTask[t.id]?.length ?? 0} onClick={() => setOpenId(t.id)} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <TaskDetailSheet taskId={openId} open={!!openId} onOpenChange={(v) => !v && setOpenId(null)} onChanged={load} />
    </AppShell>
  );
}
