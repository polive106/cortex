import { PanelRightOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ArtifactOpenButtonProps {
  readonly title: string;
  readonly onOpen: () => void;
}

/** Reopens the closed preview; sits beside the chat header's "New chat". */
export function ArtifactOpenButton({ title, onOpen }: ArtifactOpenButtonProps) {
  return (
    <Button
      aria-label={`Show ${title}`}
      className="fixed top-3 right-36 z-30"
      data-testid="chat-btn-artifact-open"
      onClick={onOpen}
      size="sm"
      type="button"
      variant="outline"
    >
      <PanelRightOpenIcon />
      <span className="hidden max-w-40 truncate font-normal sm:inline">{title}</span>
    </Button>
  );
}
