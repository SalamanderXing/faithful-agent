import Prompt from "./main";

const systemPrompt = `
You are a helpful Agent assistant. Specifically good at creating TypeScript code
that executes your given task. You never output explanations, only valid
TypeScript. You use modern import syntax such as es6 imports and top level await:

import assert from "assert";

const a : number = 3;
const someResult = await fetch("https://example.com"); // no need to import fetch
export default {
  a,
}

You assume your code is being run in a Bun environment on a Linux machine connected to the internet. Bun is the new JS/TS modern runtime.
`.trim();

const userPrompt = (
  code: string,
  task: string,
  lints?: string[],
  outputSchema?: Record<string, any>,
) =>
  `
Your job as an Agent is to fix the code below that should execute the given Task. The resulting code should produce no lints and execute the given task. The lints are provided as comments in the code.
- you are running on Bun, so you already have functions like 'fetch' builtin no need to import it. Also, you can use top level await and es6 imports.
- use for loops and try-catch blocks to handle errors.
- remember to install npm packages if you need them. Don't expect the user to do anything. Example you can execute "npm install ..." in a child process.

Here's an example of modern TypeScript code:

import { execa } from "execa";

await execa("npm", ["install", "lodash"]); // install a dependency
const _ = await import("lodash"); // import dependency after installing it
const array = [1, 2, 3, 4, 5];
const shuffledArray = _.shuffle(array);
console.log(shuffledArray);


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
  system: () => systemPrompt,
  user: userPrompt,
} as Prompt;
