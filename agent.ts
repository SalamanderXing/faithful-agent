import assert from "assert";
import { getModelCall } from "./model_call";
//import { CLIEngine } from "eslint";
import config from "./config/main";
import ts from "typescript";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import hljs from "cli-highlight";
import getAllDiagnostics from "./diagnostics";

// const code = `
// import path from "path";
//
// //;fdsf; = 243m sqd
// let boy: number = 123
// boy = 'hello'
// // const ciao = "ciao";
//
// console.log(ciao as string)
// `; // Your TypeScript code
//
//
const isValidSchema = (schema: Record<string, any>) => {
  return true; // TODO
};

function highlightCode(code: string, language = "typescript") {
  const highlightedCode = hljs(code, { language });
  return highlightedCode;
}

const getFunction = async (code: string) => {
  const compiledFilePath = "./" +
    path.join(config.executeDir, "compiled.ts");
  await fs.writeFile(compiledFilePath, code);
  return async () => {
    const res = await import(compiledFilePath);
    return res.default;
  };
};

const correctDiagnostics = async (
  code: string,
  task: string,
  maxDiagnosticRetries = 5,
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
      for (const diagnostic of diagnostics) {
        console.log(chalk.red(diagnostic));
      }
      console.log(chalk.blueBright("Trying to fix them..."));
      // @ts-ignore
      const correctUserPrompt = config.correctPrompt.user(
        // @ts-ignore
        diagnosticResults.lintedCode,
        task,
      );
      const fixingModelCall = getModelCall(
        config.correctPrompt.system(),
        correctUserPrompt,
        true,
      );
      code = await fixingModelCall() as string;
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
const getValidPlan = async (task: string, modelCall: () => Promise<any>) => {
  let parsedPlan = null as null | (() => Promise<any>);
  let rawPlan = null as null | string;
  while (!parsedPlan) {
    rawPlan = await modelCall() as string;
    console.log(chalk.blueBright("Candidte Plan:"));
    console.log(`---\n${chalk.white(highlightCode(rawPlan))}\n---`);
    rawPlan = await correctDiagnostics(rawPlan, task);
    if (rawPlan === null) {
      console.log(chalk.red("Failed to fix lints, retrying..."));
      continue;
    }
    try {
      parsedPlan = await getFunction(rawPlan as string);
    } catch (e) {
      console.log(e);
      console.log(chalk.red("Invalid plan, retrying..."));
    }
  }
  return {
    rawPlan,
    parsedPlan,
  } as {
    rawPlan: string;
    parsedPlan: () => Promise<any>;
  };
};
const getAgent = (
  instruction: string,
  jsonSchema?: Record<string, any>,
) => {
  if (jsonSchema) {
    assert(isValidSchema(jsonSchema));
  }
  const agentSystemMessage = config.agentPrompt.system();
  const agentUserMessage = config.agentPrompt.user(instruction, jsonSchema);
  const modelCall = getModelCall(agentSystemMessage, agentUserMessage);
  return async () => {
    let answer = "";
    let parsedPlan = null as null | (() => Promise<any>);
    while (parsedPlan === null) {
      const result = await getValidPlan(instruction, modelCall);
      parsedPlan = result.parsedPlan;
      while (answer !== "e" && answer !== "q" && answer !== "r") {
        answer = prompt(chalk.red(
          `What do you want to do with this plan? (e) execute, (q) quit, (r) retry`,
        )) as string;
      }
      if (answer === "q") {
        return;
      }
      if (answer === "r") {
        parsedPlan = null;
      }
    }
    const output = await (await parsedPlan());
    console.log(chalk.blueBright("Output:"));
    console.log(output);
    return output;
  };
};

export default getAgent;
