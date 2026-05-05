import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskClaim, TaskNote, Profile } from "@/types/task";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar, MapPin, Users, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";

interface Props {
  taskId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}

export default function TaskDetailSheet({ taskId, open, onOpenChange, onChanged }: Props) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [noteBody, setNoteBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!taskId) return;
    const [t, c, n] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", taskId).single(),
      supabase.from("task_claims").select("*").eq("task_id", taskId).order("claimed_at"),
      supabase.from("task_notes").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
    ]);
    if (t.data) setTask(t.data as Task);
    if (c.data) setClaims(c.data as TaskClaim[]);
    if (n.data) setNotes(n.data as TaskNote[]);

    const ids = Array.from(new Set([...(c.data ?? []).map((x: any) => x.user_id), ...(n.data ?? []).map((x: any) => x.user_id)]));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      if (p) setProfiles(Object.fromEntries(p.map((x: any) => [x.id, x])));
    }
  };

  useEffect(() => { if (open && taskId) load(); }, [open, taskId]);

  if (!task) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh]" />
      </Sheet>
    );
  }

  const myClaim = claims.find((c) => c.user_id === user?.id);
  const full = claims.length >= task.volunteers_needed;

  const claim = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("task_claims").insert({ task_id: task.id, user_id: user.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("You got it! 🎉");
    await load(); onChanged?.();
  };

  const unclaim = async () => {
    if (!myClaim) return;
    setBusy(true);
    const { error } = await supabase.from("task_claims").delete().eq("id", myClaim.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await load(); onChanged?.();
  };

  const addNote = async () => {
    if (!user || !noteBody.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("task_notes").insert({ task_id: task.id, user_id: user.id, body: noteBody.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNoteBody("");
    await load();
  };

  const markComplete = async () => {
    if (!myClaim) return;
    setBusy(true);
    const { error: e1 } = await supabase.from("task_claims").update({ completed_at: new Date().toISOString() }).eq("id", myClaim.id);
    // If all claims complete, mark task complete
    const allDone = claims.every((c) => c.id === myClaim.id || c.completed_at);
    if (allDone) {
      await supabase.from("tasks").update({ status: "complete" }).eq("id", task.id);
    } else {
      await supabase.from("tasks").update({ status: "in_progress" }).eq("id", task.id);
    }
    setBusy(false);
    if (e1) return toast.error(e1.message);
    toast.success("Marked complete");
    await load(); onChanged?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-3">
          {task.description && <p className="text-sm text-foreground/90">{task.description}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {task.scheduled_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {format(new Date(task.scheduled_at), "EEE MMM d, h:mm a")}
              </span>
            )}
            {task.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {task.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {claims.length} / {task.volunteers_needed}
            </span>
          </div>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          )}

          <div className="flex gap-2">
            {!myClaim && task.status !== "complete" && !full && (
              <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={claim} disabled={busy}>
                I got this
              </Button>
            )}
            {myClaim && !myClaim.completed_at && (
              <>
                <Button className="flex-1" onClick={markComplete} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark complete
                </Button>
                <Button variant="outline" onClick={unclaim} disabled={busy}>
                  <X className="h-4 w-4 mr-1" /> Drop
                </Button>
              </>
            )}
            {myClaim?.completed_at && (
              <Badge className="bg-success text-success-foreground">You completed this</Badge>
            )}
          </div>

          <Separator />

          <section>
            <h4 className="font-semibold text-sm mb-2">Volunteers</h4>
            {claims.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has claimed this yet.</p>
            ) : (
              <ul className="space-y-1">
                {claims.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span>{profiles[c.user_id]?.display_name ?? "Volunteer"}</span>
                    {c.completed_at ? (
                      <Badge variant="outline" className="text-success border-success">Done</Badge>
                    ) : (
                      <Badge variant="outline">On it</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold text-sm">Updates</h4>
            {myClaim && (
              <div className="space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Post an update… (e.g. picked up supplies, on my way)"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <Button size="sm" onClick={addNote} disabled={busy || !noteBody.trim()}>Post update</Button>
              </div>
            )}
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            ) : (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-muted p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      {profiles[n.user_id]?.display_name ?? "Volunteer"} · {format(new Date(n.created_at), "MMM d, h:mm a")}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
