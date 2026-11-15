# E5-US05: Artifact tools and route

**User Story**: As a user, I want the companion to publish and reopen artifacts so that every change I ask for becomes a saved version.

**Acceptance Criteria**:

- [ ] `publish_artifact({ slug, title, project? })` reads `artifacts/<slug>/index.html` from the sandbox and runs `PublishArtifact`; the model sees only the path, version, and ref
- [ ] `open_artifact({ path })` copies an `out/` artifact's source into the sandbox so it can be edited
- [ ] `list_artifacts` lists everything under `out/`
- [ ] `GET /artifacts?path&ref` on the companion serves the page as `text/html` behind the web chat's auth, with a `sandbox` CSP header
- [ ] The web chat's auth is shared by both channels from one module
- [ ] `container.ts` wires the builder and the use-cases; instructions mention artifacts

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Agent | Tools | `agents/companion/agent/tools/{publish_artifact,open_artifact,list_artifacts}.ts` |
| Agent | Route | `agents/companion/agent/channels/artifacts.ts` |
| Agent | Shared auth | `agents/companion/agent/lib/web-auth.ts` |
| Agent | Wiring and instructions | `agents/companion/agent/container.ts`, `agents/companion/agent/instructions.md` |

**Dependencies**: E5-US04

**Complexity**: M

**Status**: Pending

**Test Scenarios**:

```gherkin
Scenario: Publish from the sandbox
  Given artifacts/roadmap/index.html in the sandbox
  When publish_artifact runs for "roadmap"
  Then out/roadmap.html is committed at version 1

Scenario: Missing file
  When publish_artifact runs for a slug with no file in the sandbox
  Then the tool returns an error naming the expected path

Scenario: Unauthenticated read
  When GET /artifacts is called without a session
  Then it answers 401
```
