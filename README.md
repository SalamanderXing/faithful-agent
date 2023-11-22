# Faithful Agent 🐕

Faithful Agent started as a curiosity-driven experiment, exploring how we could
make an AI model smarter by harnessing the power of a language's Language Server
Protocol (LSP). It's an adventure in blending AI with advanced programming
language features to see how far we can push the boundaries of intelligent
planning and execution.

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
tested using both Ollama and [Replicate.com](https://replicate.com). This model
offers a balance between performance and the ability to run locally.

## Installation and Setup

1. **Prerequisites**: Install [Bun](https://bun.sh).
2. **Clone and Install**:
   ```bash
   git clone [repository URL]
   bun install
   ```
3. **Running the Model**: Use Ollama for local execution or
   [Replicate](https://replicate.com) for remote operations.

## Citing This Work

If you're using or referencing Faithful Agent in your work, please use the
following citation format:

```
[Your preferred citation format, e.g., APA, MLA, etc., with project details]
```

## Contributing

Your contributions and feedback are highly valued. If you're building upon this
project, please acknowledge "Faithful Agent". For contribution guidelines, visit
our [GitHub page](https://github.com/salamanderxing).

## Future Directions

Faithful Agent is under heavy development. Some near-term experiments include

- fixing bugs
- testing it with larger models

---

## Contact

For any inquiries or collaboration interests, please refer to the contact
information provided on my [GitHub page](https://github.com/salamanderxing).
