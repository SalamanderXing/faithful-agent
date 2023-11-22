import fs from "fs/promises";
import Agent from "./agent"; // import agent

// {
//   "task": "Fix the file main.js and write the fixed code to main_fixed.js"
// }

const fileContent = await fs.readFile("./main.js", "utf8");

const agent = new Agent({
  // here you define the task for the sub-agent. It should be simpler than your main task.
  // in this case, the sub-agent's task is simpler than the main because it only has to fix the code,
  // without thinking about reading/writing files.
  task: "Fix the given JavaScript code.",
  input: {
    code: fileContent,
  },
  // if you want the agent to return something, you must define an outputSchema!
  outputSchema: {
    type: "object",
    properties: {
      fixedCode: {
        type: "string",
      },
    },
  },
});
// fixedCode is defined in the schema above
const { fixedCode } = await agent.run(); // run takes no arguments

await fs.writeFile("./main_fixed.js", fixedCode);