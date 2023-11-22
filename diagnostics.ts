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
    rules: {
      "no-unused-expressions": "error",
    },
    //   "eqeqeq": "error", // Enforce strict equality
    //   "no-fallthrough": "error", // Prevent case statement fallthrough
    //   "no-redeclare": "error", // Disallow variable redeclaration
    //   "no-unused-expressions": "warn", // Warn for unused expressions
    //   "no-use-before-define": "error", // Disallow use before definition
    //   "array-callback-return": "warn", // Warn if array callbacks do not return
    //   "block-scoped-var": "warn", // Warn for var outside of block scope
    //   "consistent-return": "warn", // Warn for inconsistent return
    //   "curly": "warn", // Require curly braces
    //   "no-alert": "warn", // Warn against alert, confirm, prompt
    //   "no-else-return": "warn", // Warn for return before else
    //   "no-multi-spaces": "warn", // Warn for multiple spaces
    //   "no-unused-vars": "warn", // Warn for unused variables
    //   "no-var": "error", // Require let/const instead of var
    //   "prefer-const": "error", // Prefer const over let
    //   "prefer-template": "warn", // Prefer template literals
    //   "camelcase": "warn", // Enforce camelcase naming
    //   "indent": ["warn", 2], // Warn for indentation, 2 spaces
    //   "linebreak-style": ["warn", "unix"], // Enforce linebreak style
    //   "semi": ["warn", "always"], // Require semicolons
    //   "no-duplicate-imports": "error", // Disallow duplicate imports
    //   "no-useless-constructor": "warn", // Warn for useless constructors
    //   "prefer-arrow-callback": "warn", // Prefer arrow functions in callbacks
    //   "prefer-rest-params": "warn", // Suggest rest parameters
    //   "prefer-spread": "warn", // Suggest spread operator
    //   "@typescript-eslint/explicit-function-return-type": "warn", // Require explicit function return type
    //   "@typescript-eslint/no-explicit-any": "warn", // Warn against explicit any
    //   "@typescript-eslint/no-non-null-assertion": "warn", // Warn against non-null assertions
    //   "@typescript-eslint/type-annotation-spacing": "warn", // Enforce spacing in type annotations
    // },
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
  return { line, issue: message, codeLine: code.split("\n")[line] };
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
  const lintedCode = code.split("\n").map((line, i) =>
    processDiagnostics(line, i, tsDiagnostics, linterDiagnostics)
  ).join("\n");
  const diagnostics = [...tsDiagnostics, ...linterDiagnostics];
  const diagnosticsString = diagnostics.reduce((acc, diagnostic) => {
    return `${acc}\n- ${diagnostic.codeLine}: ${diagnostic.issue}`;
  }, "");
  return {
    diagnostics,
    lintedCode,
    diagnosticsString,
  };
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
