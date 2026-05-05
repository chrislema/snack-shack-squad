import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  claimedCount?: number;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
}

export default function TaskCard({ task, claimedCount = 0, onClick, rightSlot }: Props) {
  const full = claimedCount >= task.volunteers_needed;
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 shadow-card cursor-pointer transition-all hover:shadow-elevated active:scale-[0.99]",
        task.status === "complete" && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            {task.scheduled_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(task.scheduled_at), "MMM d, h:mm a")}
              </span>
            )}
            {task.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {task.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {claimedCount}/{task.volunteers_needed}
            </span>
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {task.status === "complete" ? (
            <Badge className="bg-success text-success-foreground hover:bg-success">Done</Badge>
          ) : full ? (
            <Badge variant="outline">Full</Badge>
          ) : (
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">Open</Badge>
          )}
          {rightSlot}
        </div>
      </div>
    </Card>
  );
}
