import fs from 'fs/promises';
import Agent from './agent'; // import agent

const fileContent = await fs.readFile('main.js', 'utf8');

const agent = new Agent({
  task: 'Fix the JavaScript code in main.js and write the fixed version in main_fixed.js',
  input: undefined,
  outputSchema: undefined,
});

try {
  await agent.run();
} catch (error) {
  console.error(error);
}

const fixedContent = await fs.readFile('main_fixed.js', 'utf8');
await fs.writeFile('main_fixed.js', fixedContent);