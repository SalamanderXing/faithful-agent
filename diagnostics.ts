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
      "plugin:@typescript-eslint/recommended", // Recommended rules from the TypeScript plugin
    ],
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    //rules: config.linterRules,
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
  return diagnostics.map((el) => prettifyDiagnostic(code, el));
};
const prettifyDiagnostic = (code: string, diagnostic: ts.Diagnostic) => {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    "\n",
  );
  const { line } = diagnostic.file!.getLineAndCharacterOfPosition(
    diagnostic.start!,
  );
  //return `${line}: "${code.split("\n")[line]}" ${message}`;
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
  return [line, diagnostic.message];
};

const getAllDiagnostics = async (code: string) => {
  const tsDiagnostics = getTSDiagnostics(code);
  const linterDiagnostics = await getLinterDiagnostics(code);
  const lintedCode = code.split("\n").map((line, i) => {
    const tsDiagnostic = tsDiagnostics.find((x) => x[0] === i);
    const linterDiagnostic = linterDiagnostics.find((x) => x[0] === i);
    if (tsDiagnostic && linterDiagnostic) {
      return `${line} // ERROR: ${tsDiagnostic[1]} | ERROR: ${
        linterDiagnostic[1]
      }`;
    } else if (tsDiagnostic) {
      return `${line} // ERROR: ${tsDiagnostic[1]}`;
    } else if (linterDiagnostic) {
      return `${line} // ERROR: ${linterDiagnostic[1]}`;
    } else {
      return line;
    }
  }).join("\n");
  return {
    diagnostics: [...tsDiagnostics, ...linterDiagnostics],
    lintedCode,
  };
};

export default getAllDiagnostics;
