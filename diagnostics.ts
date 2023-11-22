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
      loggerFn: () => {},
    },
    rules: {
      "no-unused-expressions": "error",
    },
    env: {
      es6: true,
      node: true,
    },
    plugins: ["@typescript-eslint"],
  },
});

const getLinterDiagnostics = async (code: string) => {
  const messages = await eslint.lintText(code);
  return messages.filter((x: ESLint.LintMessage) => x.line !== undefined).map((
    el: ESLint.LintMessage,
  ) => prettifyLinterDiagnostic(code, el));
};

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
  return { line, issue: message, codeLine: code.split("\n")[line] };
};

const prettifyLinterDiagnostic = (
  code: string,
  diagnostic: ESLint.LintMessage,
) => {
  const { line } = diagnostic;
  //return `${line}: "${code.split("\n")[line]}" ${diagnostic.message}`;
  // also saves the severity
  return { line, issue: diagnostic.message, codeLine: code.split("\n")[line] };
};

const processDiagnostics = (
  line: string,
  lineNumber: number,
  tsDiagnostics: any[],
  linterDiagnostics: any[],
): string => {
  const tsDiagnostic = tsDiagnostics.find(({ line: lineNum }) =>
    lineNum === lineNumber
  );
  const linterDiagnostic = linterDiagnostics.find(({ line: lineNum }) => {
    lineNum === lineNumber;
  });

  let diagnosticInfo = "";
  if (tsDiagnostic) {
    diagnosticInfo += `ERROR (TS): ${tsDiagnostic.issue}`;
  }
  if (linterDiagnostic) {
    diagnosticInfo += `ERROR (ESLint): ${linterDiagnostic.issue}`;
  }
  return diagnosticInfo
    ? `${line.split("//")[0]} // ${diagnosticInfo.trim()}`
    : line;
};
const getAllDiagnostics = async (
  code: string,
  outputSchema?: Record<string, any>,
): Promise<
  { diagnostics: any[]; lintedCode: string; diagnosticsString: string }
> => {
  const tsDiagnostics = getTSDiagnostics(code);
  const linterDiagnostics = await getLinterDiagnostics(code);
  const outputSchemaMatches = matches(code, outputSchema);
  if (outputSchemaMatches !== true) {
    linterDiagnostics.push({
      line: code.split("\n").length - 1,
      issue: outputSchemaMatches,
      codeLine: code.split("\n")[code.split("\n").length - 1],
    });
  }
  const todos = noTODOs(code);
  const lintedCode = code.split("\n").map((line, i) =>
    processDiagnostics(line, i, tsDiagnostics, linterDiagnostics)
  ).join("\n");
  const diagnostics = [...tsDiagnostics, ...linterDiagnostics, ...todos];
  const diagnosticsString = diagnostics.reduce((acc, diagnostic) => {
    return `${acc}\n- ${diagnostic.codeLine}: ${diagnostic.issue}`;
  }, "");
  return {
    diagnostics,
    lintedCode,
    diagnosticsString,
  };
};

const noTODOs = (code: string) => {
  const lines = code.split("\n");
  const todos = lines.map((x, i) => [x, i] as [string, number]).filter((x) =>
    x[0].includes("TODO")
  ).map((x) => ({
    line: x[1],
    issue: "TODOs are not allowed in the code",
    codeLine: x[0],
  }));
  return todos;
};

function extractDefaultExport(script: string): string {
  const match = script.match(/export default\s+([\s\S]*?)(?=\/\/|export|$)/);
  return (match ? match[1].trim() : "").trim();
}

const matches = (s: string, schema?: Record<string, any>) => {
  const defaultExport = extractDefaultExport(s).trim();
  console.log(defaultExport);
  if (!schema) {
    if (!defaultExport) {
      return true;
    }
    return "Export error. No schema is provided but there is a default export. No schema means the code should only execute, NO EXPORT OF FUNCTIONS OR ANYTHING.";
  }
  if (!defaultExport) {
    return "No default export found in file but schema is provided. The code should always export a default export that matches the schema.";
  }
  if (defaultExport.startsWith("{") && defaultExport.endsWith("}")) {
    const inner = defaultExport.slice(1, -1);
    const props = inner.split(",").map((s) => s.trim().split(":")[0]);
    const properties = Object.keys(schema.properties);
    const missing = properties.filter((p) => !props.includes(p));
    if (missing.length) {
      return `The following properties are missing in the default export: ${
        missing.join(", ")
      }.`;
    }
    return true;
  } else if (defaultExport.startsWith('"') && defaultExport.endsWith('"')) {
    console.log("her");
    const type = schema.type;
    if (type === "string") {
      return true;
    }
    return `The default export is a string but the schema is not. Schema type is ${type}.`;
  } else if (defaultExport.startsWith("[") && defaultExport.endsWith("]")) {
    const type = schema.type;
    if (type === "array") {
      return true;
    }
    return `The default export is an array but the schema is not. Schema type is ${type}.`;
  } else if (
    defaultExport.startsWith("function") && defaultExport.endsWith("}")
  ) {
    const type = schema.type;
    if (type === "function") {
      return true;
    }
    return `The default export is a function but the schema is not. Schema type is ${type}.`;
  }
  return "The default export is not a string, object or function. It should be one of those.";
};

export default getAllDiagnostics;
