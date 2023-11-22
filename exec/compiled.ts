import { readFile, writeFile } from "fs/promises";
import { exec } from "child_process";
import assert from "assert";

const content = await (async () => {
  try {
    const response = await fetch("https://example.com");
    return await response.text();
  } catch (error) {
    console.error("Error fetching the page:", error);
    return "";
  }
})();

assert.strictEqual(typeof content, "string");

await writeFile("example.html", content);

exec("xdg-open example.html");