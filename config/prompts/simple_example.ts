// {
//   "task": "sum up the input values",
//   "input": [1, 2, 3],
//   "outputSchema": {
//     "sum": "number",
//   },
// }
// this task is simple, NO NEED to use Agent!!
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export default { // export a value to fit the output schema
  sum: sum([1, 2, 3]),
};
