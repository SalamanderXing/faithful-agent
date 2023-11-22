import assert from "assert";
import { Model } from "./model_call";
import inquirer from "inquirer";
import config from "./config/main";
import ts from "typescript";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import hljs from "cli-highlight";
import getAllDiagnostics from "./diagnostics";

const isValidSchema = (schema: Record<string, any>) => {
  return true; // TODO
};

function highlightCode(code: string, language = "typescript") {
  const highlightedCode = hljs(code, { language });
  return highlightedCode;
}

const getFunction = async (code: string) => {
  const compiledFilePath = "./compiled.ts";
  await fs.writeFile(compiledFilePath, code);
  return async () => {
    const res = await import(compiledFilePath);
    return res.default;
  };
};

const correctDiagnostics = async (
  model: Model,
  code: string,
  task: string,
  maxDiagnosticRetries = 3,
  maxDiagnostics = 5,
): Promise<string | null> => {
  let diagnosticResults = await getAllDiagnostics(code);
  let diagnostics = diagnosticResults.diagnostics;
  if (diagnostics.length === 0) {
    console.log(chalk.green("No lints!"));
    return code;
  }
  if (diagnostics.length > maxDiagnostics) {
    console.log(chalk.red(`Too many lints! (${diagnostics.length})`));
    return null;
  }
  while (maxDiagnosticRetries > 0 && diagnostics.length > 0) {
    if (diagnostics.length === 0) {
      console.log(chalk.green("No lints!"));
    } else {
      console.log(chalk.red(diagnosticResults.diagnosticsString));
      model.addUserMessage(
        `
I got these errors when I tried to run your code. Give me the updated version to fix them. 
Don't tell me to install anything, do it with code or create an new Agent.

Errors from your code given by TypeScript and ESLint:
${diagnosticResults.diagnosticsString}

Reason step-by-step on why your code might be wrong and give me the updated version.
`,
      );
      console.log(chalk.blueBright("Trying to fix them..."));
      code = await model.run();
      console.log(chalk.blueBright("Corrected Candidte Plan:"));
      console.log(`---\n${chalk.white(highlightCode(code))}\n---`);
      diagnosticResults = await getAllDiagnostics(code);
      diagnostics = diagnosticResults.diagnostics;
    }
    maxDiagnosticRetries--;
  }
  if (diagnostics.length > 0) {
    console.log(
      chalk.red(
        `Failed to fix all lints! (${diagnostics.length}) and max retries reached`,
      ),
    );
    return null;
  }
  return code;
};
const getValidPlan = async (task: string, model: Model) => {
  let parsedPlan = null as null | (() => Promise<any>);
  let rawPlan = null as null | string;
  while (!parsedPlan) {
    model.reset();
    rawPlan = await model.run();
    let diagnosticResults = await getAllDiagnostics(rawPlan);
    console.log(chalk.blueBright("Candidte Plan:"));
    console.log(
      `\n${chalk.white(highlightCode(diagnosticResults.lintedCode))}\n`,
    );
    if (diagnosticResults.diagnostics.length > 0) {
      rawPlan = await correctDiagnostics(model, rawPlan, task);
    }
    if (rawPlan === null) {
      console.log(chalk.red("Failed to fix lints, retrying..."));
      continue;
    }
    if (rawPlan === "") {
      console.log(chalk.red("Empty plan, retrying..."));
      continue;
    }
    try {
      parsedPlan = await getFunction(rawPlan);
    } catch (e) {
      console.log(e);
      console.log(chalk.red("Invalid plan, retrying..."));
    }
  }
  // uses an emoji to make it easier to find in the logs
  console.log(chalk.green("✅ Plan validated successfully!"));
  return {
    rawPlan,
    parsedPlan,
  } as {
    rawPlan: string;
    parsedPlan: () => Promise<any>;
  };
};

async function getAction() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to do with this plan?",
      choices: [
        { name: "Execute", value: "e" },
        { name: "Quit", value: "q" },
        { name: "Retry", value: "r" },
      ],
    },
  ]);
  return action;
}

class Agent {
  task: string;
  input?: Record<string, any>;
  outputSchema?: Record<string, any>;

  constructor({
    task: task,
    input,
    outputSchema,
  }: {
    task: string;
    input?: Record<string, any>;
    outputSchema?: Record<string, any>;
  }) {
    this.task = task;
    this.input = input;
    this.outputSchema = outputSchema;
    if (this.outputSchema) {
      assert(isValidSchema(this.outputSchema));
    }
  }

  async run() {
    const agentSystemMessage = config.agentPrompt.system();
    const agentUserMessage = config.agentPrompt.user(
      this.task,
      this.input,
      this.outputSchema,
    );
    const model = new Model(agentSystemMessage, agentUserMessage, false);
    let answer = "";
    let parsedPlan: null | (() => Promise<any>) = null;

    while (parsedPlan === null) {
      const result = await getValidPlan(this.task, model);
      parsedPlan = result.parsedPlan;

      answer = await getAction();
      if (answer === "q") {
        return;
      }
      if (answer === "r") {
        parsedPlan = null;
      }
    }

    const output = await (await parsedPlan());
    return output;
  }
}

export default Agent;
