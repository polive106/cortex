import { defineAgent } from "eve";
import { type MockModelRequest, type MockModelResponse, mockModel } from "eve/evals";

// Deterministic double of companion for flow evals and E2E (E2-US05). No provider calls, no key.
// It has companion's real wiki tools and brain recall, on the in-memory brain. Scripted messages:
// - "ping" gets the reply "pong";
// - "demo approval" calls demo_action, which needs approval (E2-US06);
// - "save note <word>" calls write_page for wiki/note-<word>.md;
// - "save outside" calls write_page for AGENTS.md, which must be refused;
// - "read note <word>" calls read_page for wiki/note-<word>.md;
// - "what is indexed" reports the first index entry from recalled memory (E3-US06);
// - anything else gets an echo.

type Reply = MockModelResponse | string;

const note = (word: string, path?: string) => ({
  source: { title: `Note ${word}`, origin: "pasted", text: `About ${word}.` },
  pages: [{ path, title: `Note ${word}`, summary: `About ${word}`, body: `All about ${word}.\n` }],
});

function afterTool({ name, output, isError }: MockModelRequest["toolResults"][number]): Reply {
  const result = (output ?? {}) as {
    error?: string;
    message?: string;
    changes?: string[];
    body?: string;
  };
  if (name === "demo_action") {
    return isError
      ? "OK, I won't run the demo action."
      : `Demo action done: ${JSON.stringify(output)}`;
  }
  if (isError) return `OK, I won't use ${name}.`;
  if (result.error) return `Refused: ${result.error}: ${result.message}`;
  if (name === "write_page") return `Saved: ${result.changes?.join(", ")}`;
  if (name === "read_page") return `Page: ${result.body?.trim()}`;
  return `Done: ${name}`;
}

function respond({ lastUserMessage, messages, toolResults }: MockModelRequest): Reply {
  const lastResult = toolResults.at(-1);
  if (messages.at(-1)?.role === "tool" && lastResult) return afterTool(lastResult);

  const message = (lastUserMessage ?? "").trim().toLowerCase();
  const [verb, kind, word = ""] = message.split(/\s+/);
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
  if (verb === "read" && kind === "note") {
    return { toolCalls: [{ name: "read_page", input: { path: `wiki/note-${word}.md` } }] };
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
