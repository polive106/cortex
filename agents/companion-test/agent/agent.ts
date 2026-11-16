import { defineAgent } from "eve";
import { type MockModelRequest, type MockModelResponse, mockModel } from "eve/evals";

// Deterministic double of companion for flow evals and E2E (E2-US05). No provider calls, no key.
// It has companion's real wiki tools and brain recall, on the in-memory brain. Scripted messages:
// - "ping" gets the reply "pong";
// - "demo approval" calls demo_action, which needs approval (E2-US06);
// - "save note <word>" calls write_page for wiki/note-<word>.md;
// - "save outside" calls write_page for AGENTS.md, which must be refused;
// - "read note <word>" calls read_page for wiki/note-<word>.md;
// - "save url <url>" calls fetch_source, then write_page with the page under its URL (E3-US07);
// - "cite welcome" reads wiki/welcome.md and answers citing it (E3-US08);
// - "walk brain" searches the brain for "brain", then reads wiki/welcome.md (E7-US02);
// - "what is indexed" reports the first index entry from recalled memory (E3-US06);
// - "make artifact <slug>" / "revise artifact <slug>" write artifacts/<slug>/index.html with bash,
//   then call publish_artifact (E5-US07);
// - "publish missing" calls publish_artifact for a slug with no page in the sandbox;
// - anything else gets an echo.

type Reply = MockModelResponse | string;

/** A small artifact page; each revision says which one it is. */
const artifactPage = (slug: string, revision: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Artifact ${slug}</title></head><body class="bg-background p-6 text-foreground"><main class="rounded-xl border bg-card p-6"><h1 class="text-2xl font-semibold">Artifact ${slug}</h1><p class="text-muted-foreground" data-revision="${revision}">Revision ${revision}</p></main></body></html>`;

const writeArtifact = (slug: string, revision: string) => ({
  toolCalls: [
    {
      name: "bash",
      input: {
        command: `mkdir -p artifacts/${slug} && printf '%s' '${artifactPage(slug, revision)}' > artifacts/${slug}/index.html`,
      },
    },
  ],
});

const note = (word: string, path?: string) => ({
  source: { title: `Note ${word}`, origin: "pasted", text: `About ${word}.` },
  pages: [{ path, title: `Note ${word}`, summary: `About ${word}`, body: `All about ${word}.\n` }],
});

function afterTool(
  { name, output, isError }: MockModelRequest["toolResults"][number],
  slug: string,
): Reply {
  const result = (output ?? {}) as {
    error?: string;
    message?: string;
    changes?: string[];
    body?: string;
    path?: string;
    version?: number;
    url?: string;
    title?: string;
    text?: string;
  };
  if (name === "bash") {
    return {
      toolCalls: [{ name: "publish_artifact", input: { slug, title: `Artifact ${slug}` } }],
    };
  }
  if (name === "demo_action") {
    return isError
      ? "OK, I won't run the demo action."
      : `Demo action done: ${JSON.stringify(output)}`;
  }
  if (isError) return `OK, I won't use ${name}.`;
  if (result.error) return `Refused: ${result.error}: ${result.message}`;
  if (name === "fetch_source") {
    const { url = "", title = "", text = "" } = result;
    const page = { title, summary: `From ${url}`, body: `${text}\n` };
    const source = { title, origin: url, text };
    return { toolCalls: [{ name: "write_page", input: { source, pages: [page] } }] };
  }
  if (name === "write_page") return `Saved: ${result.changes?.join(", ")}`;
  if (name === "search_wiki") {
    return { toolCalls: [{ name: "read_page", input: { path: "wiki/welcome.md" } }] };
  }
  if (name === "read_page" && result.path === "wiki/welcome.md") {
    return `The brain is where the team keeps what it knows ([${result.title}](wiki/welcome.md)).`;
  }
  if (name === "read_page") return `Page: ${result.body?.trim()}`;
  if (name === "publish_artifact") return `Published: ${result.path} v${result.version}`;
  return `Done: ${name}`;
}

function respond({ lastUserMessage, messages, toolResults }: MockModelRequest): Reply {
  const message = (lastUserMessage ?? "").trim().toLowerCase();
  const [verb, kind, word = ""] = message.split(/\s+/);
  const lastResult = toolResults.at(-1);
  if (messages.at(-1)?.role === "tool" && lastResult) {
    return afterTool(lastResult, word);
  }

  if (message === "ping") return "pong";
  if (message === "demo approval") {
    return { toolCalls: [{ name: "demo_action", input: { label: "demo" } }] };
  }
  if (message === "save outside") {
    return { toolCalls: [{ name: "write_page", input: note("outside", "AGENTS.md") }] };
  }
  if (verb === "save" && kind === "note") {
    return { toolCalls: [{ name: "write_page", input: note(word) }] };
  }
  if (verb === "save" && kind === "url") {
    const url = (lastUserMessage ?? "").trim().split(/\s+/)[2] ?? "";
    return { toolCalls: [{ name: "fetch_source", input: { url } }] };
  }
  if (verb === "read" && kind === "note") {
    return { toolCalls: [{ name: "read_page", input: { path: `wiki/note-${word}.md` } }] };
  }
  if (kind === "artifact" && (verb === "make" || verb === "revise")) {
    return writeArtifact(word, verb === "make" ? "1" : "2");
  }
  if (message === "publish missing") {
    return {
      toolCalls: [{ name: "publish_artifact", input: { slug: "missing", title: "Missing" } }],
    };
  }
  if (message === "walk brain") {
    return { toolCalls: [{ name: "search_wiki", input: { query: "brain" } }] };
  }
  if (message === "cite welcome") {
    return { toolCalls: [{ name: "read_page", input: { path: "wiki/welcome.md" } }] };
  }
  if (message === "what is indexed") {
    const index = messages.find((m) => m.text.includes("<brain_index"))?.text ?? "";
    return `Indexed: ${index.split("\n").find((line) => line.startsWith("- [")) ?? "nothing"}`;
  }
  return `echo: ${lastUserMessage ?? ""}`;
}

export default defineAgent({
  model: mockModel({ modelId: "companion-test", provider: "cortex-fixtures", respond }),
});
