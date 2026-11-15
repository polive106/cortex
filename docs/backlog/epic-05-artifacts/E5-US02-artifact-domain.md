# E5-US02: Artifact domain

**User Story**: As a developer, I want artifacts modelled in the domain so that paths, versions, and the page's safety rules are enforced in one tested place.

**Acceptance Criteria**:

- [x] `ArtifactPath` accepts only `out/<kebab>.html` or `out/<kebab>/<kebab>.html`, and builds one from a slug and an optional project
- [x] `Artifact` renders a self-contained page: CSP meta first in `<head>`, a `cortex:version` meta, and the built CSS in one marked `<style>`; `Artifact.source()` strips them again so an artifact can be re-edited
- [x] Sources with external scripts, stylesheets, frames, or `<base>` are refused, and so are sources over 512 KB
- [x] `PublishArtifact` bumps the version, builds the CSS through the `ArtifactBuilder` port, and commits the file plus a `log.md` entry as one commit, re-planning once on a conflict
- [x] `ReadArtifact` (optionally at a commit ref) and `ListArtifacts` use-cases
- [x] `WikiStore` gains `readFile(path, ref?)` and `listArtifacts()`
- [x] 100% coverage

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Domain | Entities | `packages/domain/src/artifacts/entities/{artifact-path,artifact}.ts` |
| Domain | Port | `packages/domain/src/artifacts/ports/artifact-builder.ts` |
| Domain | Use-cases | `packages/domain/src/artifacts/use-cases/{publish-artifact,read-artifact,list-artifacts}.ts` |
| Domain | Store port additions | `packages/domain/src/wiki/ports/wiki-store.ts` |

**Dependencies**: E5-US01

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: First publish
  Given no file at out/acme/roadmap.html
  When PublishArtifact runs for slug "roadmap" in project "acme"
  Then one commit writes out/acme/roadmap.html at version 1 and appends to log.md

Scenario: Revision
  Given out/roadmap.html at version 2
  When it is published again
  Then the new file is version 3

Scenario: Unsafe source
  When the source has <script src="https://evil.example">
  Then PublishArtifact throws InvalidArtifactError and commits nothing
```
