import Replicate from "replicate";
import chalk from "chalk";
import ModelConfig from "./config/models/main";
import config from "./config/main";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const runReplicateModel = async (
  systemMessage: string,
  userMessage: string,
) => {
  const output = await replicate.run(
    "antoinelyset/openhermes-2.5-mistral-7b:d7ccd25700fb11c1787c25b580ac8d715d2b677202fe54b77f9b4a1eb7d73e2b",
    {
      input: {
        top_k: 50,
        top_p: 0.9,
        prompt: JSON.stringify([
          {
            "role": "system",
            "content": systemMessage,
          },
          {
            "role": "user",
            "content": userMessage,
          },
        ]),
        temperature: 0.34,
        max_new_tokens: 1000,
      },
    },
  );
  const result = Array.isArray(output) ? output.join("") : output;
  console.log(result);
  return result;
};
const runOllamaModel = async (systemMessage: string, userMessage: string) => {
  const prompt = JSON.stringify([
    {
      "role": "system",
      "content": systemMessage,
    },
    {
      "role": "user",
      "content": userMessage,
    },
  ]);
  const postData = {
    model: "openhermes2.5-mistral",
    prompt: prompt,
    stream: false,
    options: {
      num_predict: 2000,
      temperature: 0.05,
    },
  };
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  let result;
  try {
    const tmp = await response.json();
    console.log(result);
    result = tmp.response;
  } catch (e) {
    console.log(e);
    console.log(await response.text());
    throw e;
  }
  return result;
};
function extractCodeBlockContent(inputString: string): string {
  const regex = /```(.*?)\n/m;
  const match = inputString.match(regex);
  if (match && match[1]) {
    return match[1];
  } else {
    throw new Error("No code block found in the input string");
  }
}

const removeUseless = (inputString: string): string => {
  const useless = ["import { fetch }"];
  let lines = inputString.split("\n");
  for (const uselessLine of useless) {
    lines = lines.filter((line) => !line.includes(uselessLine));
  }
  return lines.join("\n").trim();
};

const getModelCall = (
  // instruction: string,
  // jsonSchema?: Record<string, any>,
  systemMessage: string,
  userMessage: string,
  verbose: boolean = false,
): () => Promise<any> => {
  if (verbose) {
    console.log(chalk.bgCyan("System message:"));
    console.log(systemMessage);
    console.log(chalk.bgBlue("User message:"));
    console.log(userMessage);
  }
  return async () => {
    let result;
    if (config.model.modelSource === "replicate") {
      result = await runReplicateModel(systemMessage, userMessage);
    } else if (config.model.modelSource === "ollama") {
      result = await runOllamaModel(systemMessage, userMessage);
    } else {
      throw new Error("Invalid model source");
    }
    result = removeUseless(result);
    try {
      const resultString = extractCodeBlockContent(result);
      return resultString;
    } catch (e) {
      return result;
    }
  };
};

export { getModelCall };
