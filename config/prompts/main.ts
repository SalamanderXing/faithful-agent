interface Prompt {
  user: () => string;
  system: () => string;
}
export default Prompt;
