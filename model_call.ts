import Replicate from "replicate";
import chalk from "chalk";
import ModelConfig from "./config/models/main";
import config from "./config/main";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const runReplicateModel = async (
  messages: Message[],
): { result: string; context: number[] } => {
  const output = await replicate.run(
    "antoinelyset/openhermes-2.5-mistral-7b:d7ccd25700fb11c1787c25b580ac8d715d2b677202fe54b77f9b4a1eb7d73e2b",
    {
      input: {
        top_k: 50,
        top_p: 0.9,
        prompt: JSON.stringify(messages),
        temperature: 0.34,
        max_new_tokens: 1000,
      },
    },
  );
  const result = (Array.isArray(output) ? output.join("") : output) as string;
  return { result, context: [] };
};
const chatML = (messages: Message[]): string => {
  return messages.map((message) =>
    `<|im_start|>${message.role}\n${message.content}<|im_end|>`
  ).join("\n") + "\n<|im_start|>assistant\n";
};
const runOllamaModel = async (messages: Message[], context?: number[]) => {
  const prompt = chatML(messages);
  // console.log(chalk.green(prompt));
  //console.log(chalk.red(prompt));
  // const systemPrompt = messages.find((message) => message.role === "system")
  //   ?.content;
  // const prompt = messages.find((message) => message.role === "user")?.content;
  const postData = {
    model: "openhermes2.5-mistral",
    prompt: prompt,
    context: context,
    stream: false,
    options: {
      num_predict: 2000,
      temperature: 0.7,
    },
  };
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  let result: string;
  const tmp = await response.json();
  result = tmp.response;
  return { result, context: tmp.context };
};
function extractCodeBlockContent(inputString: string): string {
  const lines = inputString.split("\n");
  const startLine = lines.findIndex((line) =>
    line.includes("```ts") || line.includes("```typescript")
  );
  const endLinesMaybe = lines.slice(startLine + 1).findIndex((line) =>
    line.includes("```")
  );
  const endLine = endLinesMaybe === -1 ? undefined : endLinesMaybe + startLine;
  if (startLine === -1 || endLine === undefined) {
    throw new Error("No code block found");
  }
  const codeBlock = lines.slice(startLine + 1, endLine).join("\n");
  return codeBlock;
}

const removeUseless = (inputString: string): string => {
  const useless = [
    "import { fetch }",
    "import { Agent }",
    "export default {};",
  ];
  let lines = inputString.split("\n");
  for (const uselessLine of useless) {
    lines = lines.filter((line) => !line.includes(uselessLine));
  }
  return lines.join("\n").trim();
};

const removeSurroundingCurlyBraces = (inputString: string): string => {
  if (inputString.startsWith("{") && inputString.endsWith("}")) {
    inputString = inputString.slice(1, -1);
  }
  return inputString;
};

const addMustHave = (inputString: string): string => {
  const mustHaves = [["Agent(", "import Agent from"]];
  for (const [condition, mustHave] of mustHaves) {
    if (!inputString.includes(condition)) {
      continue;
    }
    const lines = inputString.split("\n");
    // check if mustHave is already there among the lines
    const alreadyThere = lines.some((line) => line.includes(mustHave));
    if (alreadyThere) {
      return inputString;
    }
    // add mustHave at the beginning of the file
    lines.unshift(mustHave);
    inputString = lines.join("\n").trim();
  }
  return inputString;
};

// const getModelCall = (
//   // instruction: string,
//   // jsonSchema?: Record<string, any>,
//   systemMessage: string,
//   userMessage: string,
//   verbose: boolean = false,
// ): () => Promise<any> => {
//   if (verbose) {
//     console.log(chalk.bgCyan("System message:"));
//     console.log(systemMessage);
//     console.log(chalk.bgBlue("User message:"));
//     console.log(userMessage);
//   }
//   return async () => {
//     let result;
//     if (config.model.modelSource === "replicate") {
//       result = await runReplicateModel(systemMessage, userMessage);
//     } else if (config.model.modelSource === "ollama") {
//       result = await runOllamaModel(systemMessage, userMessage);
//     } else {
//       throw new Error("Invalid model source");
//     }
//     result = removeUseless(result);
//     result = addMustHave(result);
//     try {
//       const resultString = extractCodeBlockContent(result);
//       return resultString;
//     } catch (e) {
//       return result;
//     }
//   };
// };

class Model {
  systemMessage: string;
  userMessage: string;
  verbose: boolean;
  messages: Message[];
  context: number[] | undefined;

  constructor(
    systemMessage: string,
    userMessage: string,
    verbose: boolean = false,
  ) {
    this.systemMessage = systemMessage;
    this.userMessage = userMessage;
    this.verbose = verbose;
    this.messages = [];
    this.context = undefined;
    this.reset();
  }
  reset() {
    this.messages = [
      {
        role: "system",
        content: this.systemMessage,
      },
      {
        role: "user",
        content: this.userMessage,
      },
    ];
  }
  addUserMessage(message: string) {
    this.messages.push({
      role: "user",
      content: message,
    });
  }
  addAssistantMessage(message: string) {
    this.messages.push({
      role: "assistant",
      content: message,
    });
  }
  async run() {
    if (this.verbose) {
      // console.log(chalk.bgCyan("System message:"));
      // console.log(this.systemMessage);
      // console.log(chalk.bgBlue("User message:"));
      // console.log(this.userMessage);
      for (const message of this.messages) {
        console.log(chalk.bgBlue(message.role));
        console.log(message.content);
      }
    }

    let result;
    let callResult;
    if (config.model.modelSource === "replicate") {
      callResult = await runReplicateModel(this.messages);
    } else if (config.model.modelSource === "ollama") {
      callResult = await runOllamaModel(
        this.messages,
        // this.context,
      );
    } else {
      throw new Error("Invalid model source");
    }
    result = callResult.result;
    // result = removeSurroundingCurlyBraces(result);
    this.context = callResult.context;

    result = removeUseless(result);
    result = addMustHave(result);

    let resultString = result;
    if (result.includes("```ts") || result.includes("```typescript")) {
      console.log(chalk.red("EXTRACTING"));
      resultString = extractCodeBlockContent(result);
    }
    this.messages.push({
      role: "assistant",
      content: resultString,
    });
    return resultString;
  }
}

export { Model };
