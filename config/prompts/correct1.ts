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
  code: string,
  task: string,
  lints?: string[],
  outputSchema?: Record<string, any>,
) =>
  `
Your job as an Agent is to fix the code below that should execute the given Task. The resulting code should produce no lints and execute the given task. The lints are provided as comments in the code. The code should also fulfill the Rules, use the Input (if defined), and export by default an object fitting the Output Schema (if undefined).

A very common problem is that you just have to install the dependencies using execa and npm as in Example 0
"Error cannot find module ..." => "npm install <module>"

## Rules
${rules}

## Example 0
${example0}

## Example 1
${example1}

## Example 2
${example2}



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
