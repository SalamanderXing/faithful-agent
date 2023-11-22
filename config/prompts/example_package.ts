import { execa } from "execa";
import Agent from "./agent"; // import agent

// {
//   "task": "Set up a Node.js server with Express to serve compressed static files from the 'public' directory.",
// }

await execa("npm", ["install", "express", "compression"]); // INSTALL DEPENDENCIES FIST!!!

const agent = new Agent(
  {
    task:
      "Set up a Node.js server with Express to serve compressed static files from the 'public' directory.",
    // agent does not take any input and does not return anything. So no need for schema.
  },
);
// does not return anything
await agent();
