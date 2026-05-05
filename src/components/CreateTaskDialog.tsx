import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export default function CreateTaskDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [needed, setNeeded] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle(""); setDescription(""); setLocation(""); setTags(""); setScheduledAt(""); setNeeded(1);
    }
  }, [open]);

  const submit = async () => {
    if (!user || !title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      volunteers_needed: Math.max(1, needed),
      created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Task posted");
    onCreated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Post a new task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mark Field 2" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Field 2" />
            </div>
            <div className="space-y-1">
              <Label>When</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tags (comma)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="snack-bar, setup" />
            </div>
            <div className="space-y-1">
              <Label>Volunteers needed</Label>
              <Input type="number" min={1} value={needed} onChange={(e) => setNeeded(parseInt(e.target.value) || 1)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>Post task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
