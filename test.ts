import ts from "typescript";

const script1 = `
// Object example
export default {
  ciao: 3,
  boy: () => "hy"
}
export type Ciao = number;
`;

const script3 = `
// String example
export default "hey"
`;

const script4 = `
// Object with function example
export default {
  boy: () => 3,
}
`;
const script5 = `
// String example
export default 32
`;

const strings = [script1, script3, script4, script5];
const schemas = [
  {
    type: "object",
    properties: {
      ciao: { type: "number" },
      boy: { type: "function" },
    },
  },
  {
    type: "string",
  },
  {
    type: "object",
    properties: {
      boy: { type: "function" },
    },
  },
  {
    type: "number",
  },
];

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
    return "no schema is provided but there is a default export. No schema means the code should only execute.";
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

strings.forEach((s) => {
  console.log(matches(s, schemas.shift()));
});

// console.log(extractDefaultExport(script1));
// console.log(extractDefaultExport(script2));
// console.log(extractDefaultExport(script3));
// console.log(extractDefaultExport(script4));
