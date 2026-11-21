"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { AudienceSize } from "@/types";
import { AUDIENCE_SIZES } from "@/lib/simulation/constants";
import { usePlatformStore } from "@/store/platform-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXAMPLE =
  "Analyze this product demo and determine whether it is likely to spread among technical founders.";

export function NewTaskDialog({
  parentExperimentId,
  triggerLabel = "New task",
}: {
  parentExperimentId?: string | null;
  triggerLabel?: string;
}) {
  const createTicket = usePlatformStore((s) => s.createTicket);
  const running = usePlatformStore((s) => s.runningTicketId);
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState(EXAMPLE);
  const [audience, setAudience] = useState("Technical founders and indie hackers building AI tools");
  const [size, setSize] = useState<AudienceSize>(250);
  const [changeNote, setChangeNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (task.trim().length < 12 || submitting) return;
    setSubmitting(true);
    try {
      await createTicket({
        title: task.trim().slice(0, 80),
        description: task.trim(),
        audienceDescription: audience.trim(),
        audienceSize: size,
        type: "simulation",
        parentExperimentId: parentExperimentId ?? null,
        changeNote: changeNote.trim() || null,
        autoRun: true,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={Boolean(running)}>
          <Plus className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a task to the agents</DialogTitle>
          <DialogDescription>
            The agent pipeline will analyze content, define the audience, run a simulation, read the
            metrics and produce a report — updating the ticket and activity feed as it goes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Task" htmlFor="task-desc">
            <Textarea
              id="task-desc"
              rows={3}
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </Field>
          <Field label="Target audience" htmlFor="task-audience">
            <Input
              id="task-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Audience size">
              <Select value={String(size)} onValueChange={(v) => setSize(Number(v) as AudienceSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {parentExperimentId && (
              <Field label="Change from previous" hint="What did you alter for this experiment?">
                <Input
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Rewrote the opening hook"
                />
              </Field>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={submitting || task.trim().length < 12}>
            {submitting ? "Starting…" : "Create & run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
