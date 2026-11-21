import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="font-display text-6xl tracking-[-0.02em]">
        This node has <span className="italic text-muted-foreground">no ties.</span>
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-2 flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
