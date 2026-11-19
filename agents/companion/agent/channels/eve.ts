import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MEDIA_TYPES } from "@cortex/domain";
import { eveChannel } from "eve/channels/eve";
import { WEB_AUTH } from "../lib/web-auth";

// Attachments (E3-US10): the composer's limits, enforced again here (413 for size, 415 for type).
export default eveChannel({
  auth: WEB_AUTH,
  uploadPolicy: { maxBytes: ATTACHMENT_MAX_BYTES, allowedMediaTypes: ATTACHMENT_MEDIA_TYPES },
});
