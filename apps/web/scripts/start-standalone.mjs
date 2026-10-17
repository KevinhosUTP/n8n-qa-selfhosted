import { pathToFileURL } from "node:url";
import { prepareStandalone } from "./standalone-entry.mjs";

const entry = await prepareStandalone();
process.env.HOSTNAME ??= "127.0.0.1";
await import(pathToFileURL(entry).href);
