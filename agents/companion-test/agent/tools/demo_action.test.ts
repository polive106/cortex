import { describe, expect, it } from "vitest";
import demoAction from "./demo_action";

describe("demo_action", () => {
  it("echoes its label once approved", async () => {
    const execute = demoAction.execute as (input: { label: string }) => Promise<unknown>;
    await expect(execute({ label: "demo" })).resolves.toEqual({ ran: true, label: "demo" });
  });
});
