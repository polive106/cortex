import { NetworkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BrainOpenButtonProps {
  readonly onOpen: () => void;
  /** Another panel's button (the artifact preview's) sits in the usual spot. */
  readonly shifted: boolean;
}

/** Reopens the closed brain panel; sits beside the chat header's buttons. */
export function BrainOpenButton({ onOpen, shifted }: BrainOpenButtonProps) {
  return (
    <Button
      aria-label="Show the brain"
      className={cn("fixed top-3 z-30", shifted ? "right-[17rem]" : "right-36")}
      data-testid="chat-btn-brain-open"
      onClick={onOpen}
      size="sm"
      type="button"
      variant="outline"
    >
      <NetworkIcon />
      <span className="hidden font-normal sm:inline">Brain</span>
    </Button>
  );
}
