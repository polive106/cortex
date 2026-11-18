"use client";

import { createContext, useContext } from "react";

/**
 * Someone asked to read a brain page (a citation in a reply). Each ask is new, even for the same
 * page, so clicking a citation again brings the page back after moving away from it.
 */
export interface PageRequest {
  readonly path: string;
  readonly id: number;
}

/**
 * Opens a brain page in the reader beside the chat (E7-US04). Citations and the brain panel are
 * separate features, so the chat provides this and citations read it. Undefined outside the chat:
 * citations then link to GitHub.
 */
export const BrainReaderContext = createContext<((path: string) => void) | undefined>(undefined);

export const useOpenBrainPage = () => useContext(BrainReaderContext);
