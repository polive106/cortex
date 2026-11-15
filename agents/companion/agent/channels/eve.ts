import { eveChannel } from "eve/channels/eve";
import { WEB_AUTH } from "../lib/web-auth";

export default eveChannel({ auth: WEB_AUTH });
