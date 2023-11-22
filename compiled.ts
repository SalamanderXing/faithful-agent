import fs from "fs/promises";
import Agent from "./agent.js"; // import agent

// {
//   "task": "Fix the code.",
//   "input": {
//     "code": "const a = 3\n\nconsole.log(a1) // prints a\n"
//   },
//   "outputSchema": {
//     "type": "object",
//     "properties": {
//       "fixedCode": {
//         "type": "string"
//       }
//     }
//   }
// }

const agent = new Agent({
  task: "Fix the code.",
  input: {
    code: `const a = 3\n\nconsole.log(a1) // prints a\n`
  },
  outputSchema: {
    type: "object",
    properties: {
      fixedCode: {
        type: "string"
      }
    }
  }
});
// fixedCode is defined in the schema above
const { fixedCode } = await agent.run(); // run takes no arguments

await fs.writeFile("fixed_code.js", fixedCode);