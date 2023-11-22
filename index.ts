import getAgent from "./agent";

const main = async () => {
  const instruction = prompt("What do you want me to do?\n") as string;
  // const instruction = "create a file in the current directory named 'hello.py' that prints hello world";
  // const instruction = "Raise slightly the volume on my Linux machine.";
  //const instruction = "Check the current weather in Amsterdam.";
  const agent = getAgent(instruction);
  const output = await agent();
  console.log(output);
};

await main();
