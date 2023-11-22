import Prompt from "./main";
import systemPrompt from "./system";
import fs from "fs";
import path from "path";
const example0 = fs.readFileSync(
  path.join(__dirname, "./example_package.ts"),
  "utf8",
);
const example1 = fs.readFileSync(
  path.join(__dirname, "./simple_example.ts"),
  "utf8",
);

const example2 = fs.readFileSync(
  path.join(__dirname, "./example2.ts"),
  "utf8",
);
const rules = fs.readFileSync(
  path.join(__dirname, "./rules.md"),
  "utf8",
);
const userPrompt = (
  task: string,
  input: Record<string, any>,
  outputSchema?: Record<string, any>,
) => {
  const params = {
    task,
    input: input,
    outputSchema: outputSchema,
  };
  return `
Your job as an Agent is to provide the valid TypeScript code to plan and execute step by step the "task" given below. The code should also fulfill the Rules, use the "input" (if defined), and export by default an object fitting the "outputSchema" (if undefined).

## Rules
${rules}

## Example 0
${example0}

## Example 1
${example1}

## Example 2
${example2}

## End Examples

## Your Task
${JSON.stringify(params, null, 2)}
`;
};

export default {
  system: systemPrompt,
  user: userPrompt,
} as Prompt;
