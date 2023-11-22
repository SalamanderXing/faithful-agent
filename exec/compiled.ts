import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

const exampleHtmlPath = path.join(process.cwd(), "example.html");
const newFileName = "boy.html";

// Change the file name
fs.renameSync(exampleHtmlPath, `${newFileName}.html`);

// Open the file in the default browser
exec("xdg-open " + path.join(process.cwd(), newFileName) + ".html");