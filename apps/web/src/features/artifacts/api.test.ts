import type { EveMessage } from "eve/react";
import { describe, expect, it } from "vitest";
import { artifactUrl, artifactVersions } from "./api";

const tool = (callId: string, name: string, output: unknown, state = "completed") => ({
  type: "tool",
  callId,
  stepIndex: 0,
  kind: "tool",
  name,
  label: name,
  state,
  output,
});

const message = (id: string, parts: unknown[]) =>
  ({ id, role: "assistant", parts, metadata: {} }) as unknown as EveMessage;

const published = (version: number, ref?: string, path = "out/acme/plan.html") => ({
  published: true,
  path,
  title: "Plan",
  version,
  changed: true,
  ...(ref ? { ref } : {}),
});

describe("artifactVersions", () => {
  it("lists every published or opened version, oldest first", () => {
    const messages = [
      message("m1", [
        { type: "text", text: "hi" },
        tool("c1", "publish_artifact", published(1, "a")),
      ]),
      message("m2", [
        tool("c2", "publish_artifact", published(2, "b")),
        tool("c3", "open_artifact", {
          opened: true,
          path: "out/old.html",
          slug: "old",
          title: "Old",
          version: 4,
          file: "artifacts/old/index.html",
        }),
      ]),
    ];
    expect(artifactVersions(messages)).toEqual([
      { id: "c1", path: "out/acme/plan.html", title: "Plan", version: 1, ref: "a" },
      { id: "c2", path: "out/acme/plan.html", title: "Plan", version: 2, ref: "b" },
      { id: "c3", path: "out/old.html", title: "Old", version: 4, ref: undefined },
    ]);
  });

  it("skips calls that are running, failed, refused, or reported a repeat", () => {
    const messages = [
      message("m1", [
        tool("c1", "publish_artifact", published(1, "a")),
        tool("c2", "publish_artifact", undefined, "running"),
        tool("c3", "publish_artifact", { error: "InvalidArtifactError", message: "no" }),
        tool("c4", "publish_artifact", { ...published(1), changed: false }),
        tool("c5", "write_page", { committed: true }),
        tool("c6", "publish_artifact", published(2, "b"), "failed"),
        { type: "tool", callId: "c7", name: "publish_artifact", state: "streaming", inputText: "" },
      ]),
    ];
    expect(artifactVersions(messages).map((v) => v.id)).toEqual(["c1"]);
  });

  it("shows an unchanged publish when its version isn't listed yet", () => {
    const messages = [
      message("m1", [tool("c1", "publish_artifact", { ...published(3), changed: false })]),
    ];
    expect(artifactVersions(messages)).toEqual([
      { id: "c1", path: "out/acme/plan.html", title: "Plan", version: 3, ref: undefined },
    ]);
  });
});

describe("artifactUrl", () => {
  it("points at the agent's artifact route, pinned to the commit when known", () => {
    expect(artifactUrl("companion", { path: "out/a b.html", ref: "abc" })).toBe(
      "/eve/companion/artifacts?path=out%2Fa+b.html&ref=abc",
    );
    expect(artifactUrl("companion", { path: "out/a.html" })).toBe(
      "/eve/companion/artifacts?path=out%2Fa.html",
    );
  });
});
