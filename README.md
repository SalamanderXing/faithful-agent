# Faithful Agent 🐕

Faithful Agent is an experiment exploring how we could make an LLM model smarter
by harnessing the power of a language's Language Server Protocol (LSP). It's a
test to see how far we can push the boundaries of intelligent planning and
execution.

## Features

- **Reliable Execution**: The agent is committed to executing the plan as
  formulated, reflecting the project's dedication to dependability.
- **TypeScript for Formal Verification**: TypeScript is key in thoroughly
  evaluating plans before they're put into action, ensuring high-quality
  execution.

## Why TypeScript? 🤔

TypeScript is chosen for its strict type system, offering a level of formal
verification that's hard to achieve with more flexible languages like Python.
This robustness is vital in ensuring plan accuracy and reliability.

## How It Works

1. **Plan Generation**: The model, specifically OpenHermes2.5, initiates the
   planning process.
2. **Verification**: TypeScript rigorously checks the plan for errors and
   inconsistencies.
3. **Iterative Improvement**: If any issues arise, the plan is revised until it
   meets all criteria.
4. **Execution**: The agent, along with any sub-agents it creates, begins
   executing the validated plan.

## About the Model

The project utilizes the
[OpenHermes2.5 model](https://huggingface.co/teknium/OpenHermes-2.5-Mistral-7B),
because it's the smallest (7B!) model I could find that is remotely good enough
for experimenting with agents. I tested using both Ollama and
[Replicate.com](https://replicate.com).

Thanks [@Teknium1](https://twitter.com/Teknium1),
[Mistral.ai](https://twitter.com/MistralAI).

## Installation and Setup

1. **Prerequisites**: The easiest way to run it is with [Bun](https://bun.sh)
   but you can also use `ts-node`.
2. **Clone and Install**:
   ```bash
   git clone https://github.com/salamanderXing/faithful-agent
   cd faithful-agent
   bun install
   ```
3. **Start Ollama (optional)**:

   ```bash
   ollama serve
   ```

4. **Run Faithful Agent**
   ```bash
   bun start
   ```
   It will prompt you first what is its task and then again to confirm each plan
   before execution.

## Contributing

Your contributions and feedback are highly valued. If you're building upon this
project, please acknowledge "Faithful Agent".

## Future Directions

Faithful Agent is under heavy development and still unstable. Some near-term
experiments include

- fixing bugs
- testing it with larger models

---

## Citing This Work

If you're using or referencing Faithful Agent in your work, please use the
following citation format:

Zani, G. (2023). Faithful Agent: TypeScript-powered AI planning and execution
[Computer software]. GitHub. https://github.com/salamanderXing/faithful-agent

## Contact

For any inquiries or collaboration interests, please refer to the contact
information provided on my [GitHub page](https://github.com/salamanderxing).
