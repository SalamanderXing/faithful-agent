import Prompt from "./main";
import systemPrompt from "./system";
import fs from "fs";
import path from "path";

const fileContent = fs.readFileSync(
  path.join(__dirname, "./example.ts"),
  "utf8",
);
const rules = fs.readFileSync(
  path.join(__dirname, "./rules.md"),
  "utf8",
);

const userPrompt = (
  code: string,
  task: string,
  lints?: string[],
  outputSchema?: Record<string, any>,
) =>
  `
Your job as an Agent is to fix the code below that should execute the given Task. The resulting code should produce no lints and execute the given task. The lints are provided as comments in the code. The code should also fulfill the Rules.

## Rules
${rules}

## Example of modern TypeScript code
${fileContent}

## Task
${task}
${
    outputSchema
      ? `
## Output Schema

${JSON.stringify(outputSchema, null, 2)}
`
      : ""
  }
## Your Code
${code}

${
    !lints ? "" : `
## Errors and Lints to fix:
${lints.join("\n")}
`
  };
`.trim();

export default {
  system: systemPrompt,
  user: userPrompt,
} as Prompt;
