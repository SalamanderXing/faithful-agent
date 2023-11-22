import Agent from "./agent";
import chalk from "chalk";

const main = async () => {
  const task = prompt(
    "\t" + chalk.black(chalk.bgWhite("What can I help you with?\n")),
  ) as string;
  const outputSchema = undefined;
  // const instruction =
  //   "in the current directory theres a file called ciao.py. Read it, then fix it for me cause it does not work. Write the fixed version as fixed_ciao.py";
  //const instruction = "give me the first 100 numbers.";
  // const outputSchema = {
  //   numbers: "number[]",
  // };
  // const instruction =
  //   "Create a demo file called index.html and open it in my default browser.";
  //const outputSchema = undefined;
  // const instruction = "create a file in the current directory named 'hello.py' that prints hello world";
  // const instruction = "Raise slightly the volume on my Linux machine.";
  // const instruction = "Check the current weather in Amsterdam.";
  console.log({ task });
  const agent = new Agent({ task, outputSchema });
  const output = await agent.run();
  console.log({ output });
};

await main();
