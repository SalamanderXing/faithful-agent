import fs from "fs/promises";
import Agent from "./agent"; // import agent

// {
//   "task": "fix the python code in main.py and write the fixed version in fixed_main.py",
//   "input": undefined,
//   "outputSchema": undefined,
// }

const fileContent = await fs.readFile("./main.py", "utf8");

const agent = new Agent({
  // here you define the task for the sub-agent. It should be simpler than your main task.
  // in this case, the sub-agent's task is simpler than the main because it only has to fix the code,
  // without thinking about reading/writing files.
  task: "Give me the fixed version of this python code.",
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

await fs.writeFile("./fixed_main.py", fixedCode);
