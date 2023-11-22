import { execa } from "execa";

await execa("npm", ["install", "luxon"]);

const { DateTime } = await import("luxon"); // Require luxon after installation

const nowUtc = DateTime.utc();
console.log(nowUtc.toISO());
