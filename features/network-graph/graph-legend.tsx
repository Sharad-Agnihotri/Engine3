export function GraphLegend() {
  const nodes: [string, string][] = [
    ["In-target", "bg-node-target"],
    ["Out-of-target", "bg-node-out"],
    ["Unseen", "bg-node-neutral"],
    ["Watched", "bg-info"],
    ["Liked / commented", "bg-node-engaged"],
    ["Shared", "bg-node-shared"],
    ["Saved", "bg-mist"],
    ["Followed", "bg-plum"],
    ["Seed", "bg-node-seed"],
  ];
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 space-y-1.5 border border-border bg-card/95 p-2.5 text-2xs shadow-sm backdrop-blur">
      <p className="font-semibold uppercase tracking-wide text-muted-foreground">Legend</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {nodes.map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-border pt-1">
        <div className="flex items-center gap-1.5">
          <svg width="18" height="6">
            <line x1="0" y1="3" x2="18" y2="3" stroke="hsl(var(--node-shared))" strokeWidth="1.5" />
          </svg>
          <span className="text-muted-foreground">Shared along this tie</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="18" height="6">
            <line x1="0" y1="3" x2="18" y2="3" stroke="hsl(var(--plum))" strokeWidth="1.5" />
          </svg>
          <span className="text-muted-foreground">New follow (created mid-cascade)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="18" height="6">
            <line
              x1="0"
              y1="3"
              x2="18"
              y2="3"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </svg>
          <span className="text-muted-foreground">Latent / inactive tie</span>
        </div>
      </div>
    </div>
  );
}
