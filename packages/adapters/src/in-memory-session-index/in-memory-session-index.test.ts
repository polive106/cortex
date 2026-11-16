import { describeSessionIndexContract } from "../contracts/session-index-contract";
import { InMemorySessionIndex } from "./in-memory-session-index";

describeSessionIndexContract("InMemorySessionIndex", async () => new InMemorySessionIndex());
