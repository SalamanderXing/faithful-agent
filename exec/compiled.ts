import getAgent from "./agent";
import fs from "fs/promises";

const fileContent = await fs.readFile("./main.py", "utf8");

const agent = getAgent({
  instruction: "Give me the fixed version of this python code.",
  input: {
    code: fileContent,
  },
  outputSchema: {
    code: "string",
  },
});

const { code } = await agent();

await fs.writeFile("./fixed_main.py", code);