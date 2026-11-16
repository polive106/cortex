import { CrosshairIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BrainFollowButtonProps {
  /** The view is following the agent right now (off, or paused by a hand move). */
  readonly following: boolean;
  readonly onToggle: () => void;
}

/** Floats over the brain panel's graph: shows whether the view follows the agent (E7-US03). */
export function BrainFollowButton({ following, onToggle }: BrainFollowButtonProps) {
  return (
    <Button
      aria-label="Follow the agent"
      aria-pressed={following}
      className={cn(
        "absolute right-3 bottom-3 z-10 border-white/10 bg-[#1b1b1b]/80 text-neutral-400 hover:bg-white/10 hover:text-white",
        following && "text-white",
      )}
      data-testid="chat-btn-brain-follow"
      onClick={onToggle}
      size="sm"
      type="button"
      variant="outline"
    >
      <CrosshairIcon />
      <span className="font-normal">{following ? "Following" : "Follow"}</span>
    </Button>
  );
}
