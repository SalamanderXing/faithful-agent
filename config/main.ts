const config = {
  agentPrompt: (await import("./prompts/agent1")).default,
  correctPrompt: (await import("./prompts/correct1")).default,
  model: (await import("./models/model1")).default,
  executeDir: "./exec",
};

export default config;
export type Config = typeof config;
