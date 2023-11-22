import Prompt from "./main";
import systemPrompt from "./system";
import fs from "fs";
import path from "path";

const exampleText = fs.readFileSync(
  path.join(__dirname, "./example.ts"),
  "utf8",
);
const rules = fs.readFileSync(
  path.join(__dirname, "./rules.md"),
  "utf8",
);
const userPrompt = (task: string, outputSchema?: Record<string, any>) => `
Your job as an Agent is to provide the valid TypeScript code to plan and execute step by step the Task given below.

## Rules
${rules}

## Example of modern TypeScript code
${exampleText}

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
`;

export default {
  system: systemPrompt,
  user: userPrompt,
} as Prompt;
