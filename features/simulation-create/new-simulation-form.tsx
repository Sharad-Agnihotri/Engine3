"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Loader2, Sparkles } from "lucide-react";
import type { AudienceSize } from "@/types";
import { DEFAULT_SIM_CONFIG, PERSONA_DIMENSIONS } from "@/lib/simulation/constants";
import { useSimulationStore } from "@/store/simulation-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/common/slider-field";
import { useLLMStatus } from "@/components/common/llm-status-badge";
import { cn } from "@/lib/utils";
import { VideoUpload } from "./video-upload";
import { SimulationConfigForm } from "./simulation-config";

const AGE_GROUPS: { label: string; range: [number, number] }[] = [
  { label: "13–17", range: [13, 17] },
  { label: "18–24", range: [18, 24] },
  { label: "25–34", range: [25, 34] },
  { label: "35–44", range: [35, 44] },
  { label: "45–54", range: [45, 54] },
  { label: "55+", range: [55, 65] },
];

const FOLLOWER_OPTIONS: { label: string; value: number }[] = [
  { label: "Under 1K", value: 500 },
  { label: "1K–10K", value: 5_000 },
  { label: "10K–100K", value: 40_000 },
  { label: "100K–1M", value: 300_000 },
  { label: "1M+", value: 2_000_000 },
];

const VIEWER_COUNTS: { value: AudienceSize; note: string }[] = [
  { value: 100, note: "Quick test" },
  { value: 250, note: "" },
  { value: 500, note: "Balanced" },
  { value: 1000, note: "" },
  { value: 5000, note: "Most accurate" },
];

function describeAudience(interests: string, ages: number[]): string {
  const who = interests.trim() ? `People into ${interests.trim()}` : "General audience";
  if (ages.length === 0) return `${who}, all ages`;
  const lo = AGE_GROUPS[Math.min(...ages)]!.range[0];
  const hi = AGE_GROUPS[Math.max(...ages)]!.range[1];
  return `${who}, aged ${lo}–${hi >= 65 ? "65+" : hi}`;
}

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 border-b border-border py-10 first:pt-0 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <p className="font-mono text-[11px] text-clay">Step {n}</p>
        <h2 className="mt-2 font-display text-[28px] leading-none tracking-[-0.01em]">{title}</h2>
        {hint && <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        active
          ? "border-foreground/50 bg-foreground/[0.07] text-foreground"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function NewSimulationForm() {
  const router = useRouter();
  const draft = useSimulationStore((s) => s.draft);
  const setDraftName = useSimulationStore((s) => s.setDraftName);
  const setDraftVideo = useSimulationStore((s) => s.setDraftVideo);
  const setContentProfile = useSimulationStore((s) => s.setContentProfile);
  const patchAudience = useSimulationStore((s) => s.patchAudience);
  const setDimensionWeight = useSimulationStore((s) => s.setDimensionWeight);
  const patchConfig = useSimulationStore((s) => s.patchConfig);
  const createDraftSimulation = useSimulationStore((s) => s.createDraftSimulation);
  const llm = useLLMStatus();

  const [ages, setAges] = useState<number[]>([1, 2]);
  const [interests, setInterests] = useState("");
  const [title, setTitle] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);

  const interestTags = useMemo(
    () => interests.split(/[,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
    [interests],
  );
  const ageRange = useMemo<[number, number] | undefined>(
    () =>
      ages.length
        ? [AGE_GROUPS[Math.min(...ages)]!.range[0], AGE_GROUPS[Math.max(...ages)]!.range[1]]
        : undefined,
    [ages],
  );
  const audienceHint = useMemo(() => ({ interests: interestTags, ageRange }), [interestTags, ageRange]);

  // Keep the engine's audience description and age band in sync with the simple inputs.
  useEffect(() => {
    const lo = ages.length ? AGE_GROUPS[Math.min(...ages)]!.range[0] : undefined;
    const hi = ages.length ? AGE_GROUPS[Math.max(...ages)]!.range[1] : undefined;
    patchAudience({
      targetDescription: describeAudience(interests, ages),
      ageRange: lo != null && hi != null ? [lo, hi] : undefined,
      interestTags: interests.split(/[,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
    });
  }, [ages, interests, patchAudience]);

  const toggleAge = (i: number) =>
    setAges((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const setViewers = (size: AudienceSize) => {
    patchAudience({ audienceSize: size });
    patchConfig({ maxAgents: Math.min(size, 300) });
  };

  const handleCreate = async (autostart: boolean) => {
    if (creating || videoBusy) return;
    setCreating(true);
    try {
      const base = title.trim() || draft.video?.fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      setDraftName(
        base ? base : `Test · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      );
      // A fresh viewer sample per test (stored with the test, so replays are exact).
      if (draft.config.randomSeed === DEFAULT_SIM_CONFIG.randomSeed) {
        patchConfig({ randomSeed: Math.floor(Math.random() * 9_000_000) + 1_000 });
      }
      const sim = await createDraftSimulation();
      router.push(`/simulations/${sim.id}${autostart ? "?run=1" : ""}`);
    } finally {
      setCreating(false);
    }
  };

  const ageSummary =
    ages.length === 0
      ? "All ages"
      : `${AGE_GROUPS[Math.min(...ages)]!.range[0]}–${
          AGE_GROUPS[Math.max(...ages)]!.range[1] >= 65 ? "65+" : AGE_GROUPS[Math.max(...ages)]!.range[1]
        }`;

  return (
    <div className="mx-auto max-w-4xl pb-6">
      <Step n={1} title="Your video" hint="Add the title you'll post it with, then upload the video. We'll watch it, score it, and check if the topic is trending.">
        <div className="mb-4 space-y-2">
          <label htmlFor="video-title" className="text-[13px] text-foreground">
            Video title or caption <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="video-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "sheru bhai aura farming"'
            maxLength={140}
          />
          <p className="text-xs text-muted-foreground">
            We search the web to see if this topic is trending on Instagram right now. A hot topic helps a little.
          </p>
        </div>
        <VideoUpload
          title={title}
          video={draft.video}
          profile={draft.contentProfile}
          audienceHint={audienceHint}
          onChange={setDraftVideo}
          onProfile={setContentProfile}
          onBusyChange={setVideoBusy}
        />
      </Step>

      <Step n={2} title="Who is it for?" hint="Pick the age groups you want to reach. Choose none to test with all ages.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {AGE_GROUPS.map((g, i) => (
            <Chip key={g.label} active={ages.includes(i)} onClick={() => toggleAge(i)} className="text-center">
              {g.label}
            </Chip>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <label htmlFor="interests" className="text-[13px] text-foreground">
            What are they into? <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. fitness, gaming, cooking, small business"
          />
        </div>
      </Step>

      <Step
        n={3}
        title="Your account"
        hint="Your follower count decides how many people see it first. We also create AI viewers to watch it. More viewers gives a more reliable answer but takes longer."
      >
        <p className="mb-2 text-[13px] text-foreground">How many followers do you have?</p>
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {FOLLOWER_OPTIONS.map((f) => (
            <Chip
              key={f.label}
              active={(draft.audience.followers ?? 5_000) === f.value}
              onClick={() => patchAudience({ followers: f.value })}
              className="text-center"
            >
              {f.label}
            </Chip>
          ))}
        </div>
        <p className="mb-2 text-[13px] text-foreground">How many AI viewers should watch it?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {VIEWER_COUNTS.map((c) => (
            <Chip key={c.value} active={draft.audience.audienceSize === c.value} onClick={() => setViewers(c.value)}>
              <span className="tabular block text-lg leading-tight text-foreground">{c.value.toLocaleString()}</span>
              <span className="mt-0.5 block h-4 text-[11px] text-muted-foreground">{c.note}</span>
            </Chip>
          ))}
        </div>

        {llm?.configured && (
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-border-strong">
            <input
              type="checkbox"
              checked={draft.config.aiMode}
              onChange={(e) =>
                patchConfig({ aiMode: e.target.checked, maxAgents: Math.min(draft.audience.audienceSize, 300) })
              }
              className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-clay" /> Smart viewers
              </span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">
                Each viewer thinks and reacts using AI, and tells you why. Slower, and uses up to 300 viewers.
              </span>
            </span>
          </label>
        )}
      </Step>

      {/* Everything else keeps its sensible default, tucked away. */}
      <div className="py-8">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={showMore}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", showMore && "rotate-180")} />
          More settings <span className="text-muted-foreground/60">(not needed for most tests)</span>
        </button>
        {showMore && (
          <div className="mt-6 space-y-8 rounded-xl border border-border bg-subtle/60 p-6">
            <SimulationConfigForm
              config={draft.config}
              onPatch={patchConfig}
              audienceSize={draft.audience.audienceSize}
            />
            <div className="space-y-3 border-t border-border pt-6">
              <p className="text-[13px] text-foreground">Viewer traits</p>
              <p className="text-xs text-muted-foreground">
                Higher means viewers are more similar to your target on that trait.
              </p>
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {PERSONA_DIMENSIONS.filter((d) => d.key !== "age").map((dim) => (
                  <SliderField
                    key={dim.key}
                    label={dim.label}
                    hint={dim.help}
                    value={draft.audience.dimensionWeights[dim.key]}
                    onChange={(v) => setDimensionWeight(dim.key, v)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-8 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-8 py-4 backdrop-blur">
        <p className="text-[13px] text-muted-foreground">
          {videoBusy
            ? "Checking your video…"
            : draft.video
              ? "Video ready"
              : "No video yet, you can still run a test"}{" "}
          ·{" "}
          <span className="text-foreground">{ageSummary}</span> ·{" "}
          <span className="text-foreground">{draft.audience.audienceSize.toLocaleString()} viewers</span> ·{" "}
          <span className="text-foreground">
            {FOLLOWER_OPTIONS.find((f) => f.value === (draft.audience.followers ?? 5_000))?.label ?? "1K–10K"} followers
          </span>
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={creating || videoBusy} onClick={() => handleCreate(false)}>
            Save for later
          </Button>
          <Button size="lg" disabled={creating || videoBusy} onClick={() => handleCreate(true)}>
            {creating ? <Loader2 className="animate-spin" /> : null}
            Start test
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
