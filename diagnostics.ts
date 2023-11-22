import ts from "typescript";
// @ts-ignore
import { ESLint } from "eslint";

import prettier from "prettier";

const eslint = new ESLint({
  extensions: [".ts"],
  useEslintrc: false,
  overrideConfig: {
    parser: "@typescript-eslint/parser",
    extends: [
      "eslint:recommended", // ESLint's recommended rules
      //"plugin:@typescript-eslint/recommended", // Recommended rules from the TypeScript plugin
    ],
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      //"no-unused-expressions": "error",
      "eqeqeq": "error", // Enforce strict equality
      "no-fallthrough": "error", // Prevent case statement fallthrough
      "no-redeclare": "error", // Disallow variable redeclaration
      "no-unused-expressions": "warn", // Warn for unused expressions
      "no-use-before-define": "error", // Disallow use before definition
      "array-callback-return": "warn", // Warn if array callbacks do not return
      "block-scoped-var": "warn", // Warn for var outside of block scope
      "consistent-return": "warn", // Warn for inconsistent return
      "curly": "warn", // Require curly braces
      "no-alert": "warn", // Warn against alert, confirm, prompt
      "no-else-return": "warn", // Warn for return before else
      "no-multi-spaces": "warn", // Warn for multiple spaces
      "no-unused-vars": "warn", // Warn for unused variables
      "no-var": "error", // Require let/const instead of var
      "prefer-const": "error", // Prefer const over let
      "prefer-template": "warn", // Prefer template literals
      "camelcase": "warn", // Enforce camelcase naming
      "indent": ["warn", 2], // Warn for indentation, 2 spaces
      "linebreak-style": ["warn", "unix"], // Enforce linebreak style
      "semi": ["warn", "always"], // Require semicolons
      "no-duplicate-imports": "error", // Disallow duplicate imports
      "no-useless-constructor": "warn", // Warn for useless constructors
      "prefer-arrow-callback": "warn", // Prefer arrow functions in callbacks
      "prefer-rest-params": "warn", // Suggest rest parameters
      "prefer-spread": "warn", // Suggest spread operator
      "@typescript-eslint/explicit-function-return-type": "warn", // Require explicit function return type
      "@typescript-eslint/no-explicit-any": "warn", // Warn against explicit any
      "@typescript-eslint/no-non-null-assertion": "warn", // Warn against non-null assertions
      "@typescript-eslint/type-annotation-spacing": "warn", // Enforce spacing in type annotations
    },
    // config.linterRules,
    env: {
      es6: true,
      node: true,
    },
    plugins: ["@typescript-eslint"],
  },
});

const compilerOptions = {
  module: ts.ModuleKind.NodeNext,
  target: ts.ScriptTarget.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: true, // Don't output files
};

const getTSDiagnostics = (code: string) => {
  const host = ts.createCompilerHost(compilerOptions);
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (filename: string) =>
    filename === "file.ts"
      ? ts.createSourceFile(filename, code, ts.ScriptTarget.ESNext)
      : getSourceFile(filename, ts.ScriptTarget.ESNext);

  const program = ts.createProgram(["file.ts"], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) =>
    d.file!.fileName === "file.ts"
  );
  return diagnostics.map((el) => prettifyTSDiagnostic(code, el));
};
const prettifyTSDiagnostic = (code: string, diagnostic: ts.Diagnostic) => {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    "\n",
  );
  const { line } = diagnostic.file!.getLineAndCharacterOfPosition(
    diagnostic.start!,
  );
  //return `${line}: "${code.split("\n")[line]}" ${message}`;
  // also saves the severity
  return [line, message];
};

const getLinterDiagnostics = async (code: string) => {
  const messages = await eslint.lintText(code);
  return messages.filter((x: ESLint.LintMessage) => x.line !== undefined).map((
    el: ESLint.LintMessage,
  ) => prettifyLinterDiagnostic(code, el));
};

const prettifyLinterDiagnostic = (
  code: string,
  diagnostic: ESLint.LintMessage,
) => {
  const { line } = diagnostic;
  //return `${line}: "${code.split("\n")[line]}" ${diagnostic.message}`;
  // also saves the severity
  return [line, diagnostic.message, diagnostic.severity];
};

const processDiagnostics = (
  line: string,
  lineNumber: number,
  tsDiagnostics: any[],
  linterDiagnostics: any[],
): string => {
  const tsDiagnostic = tsDiagnostics.find(([lineNum]) =>
    lineNum === lineNumber
  );
  const linterDiagnostic = linterDiagnostics.find(([lineNum]) =>
    lineNum === lineNumber
  );

  let diagnosticInfo = "";
  if (tsDiagnostic) {
    diagnosticInfo += `ERROR (TS): ${tsDiagnostic[1]} `;
  }
  if (linterDiagnostic) {
    diagnosticInfo += `ERROR (ESLint): ${linterDiagnostic[1]}`;
  }

  return diagnosticInfo
    ? `${line.split("//")[0]} // ${diagnosticInfo.trim()}`
    : line;
};
const getAllDiagnostics = async (
  code: string,
): Promise<{ diagnostics: any[]; lintedCode: string }> => {
  const tsDiagnostics = getTSDiagnostics(code);
  const linterDiagnostics = await getLinterDiagnostics(code);
  const lintedCode = code.split("\n").map((line, i) =>
    processDiagnostics(line, i, tsDiagnostics, linterDiagnostics)
  ).join("\n");

  return {
    diagnostics: [...tsDiagnostics, ...linterDiagnostics],
    lintedCode,
  };
};

export default getAllDiagnostics;
