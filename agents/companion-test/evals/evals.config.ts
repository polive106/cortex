import { defineEvalConfig } from "eve/evals";

// Deterministic flow evals against the mockModel double. They're free, so pre-commit runs them.
export default defineEvalConfig({ timeoutMs: 30_000 });
