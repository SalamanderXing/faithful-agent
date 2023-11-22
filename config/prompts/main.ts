interface Prompt {
  user: (...args: any[]) => string;
  system: () => string;
}
export default Prompt;
