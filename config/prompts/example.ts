import fs from "fs";
import { execa } from "execa";
import { getAgent } from "./agent"; // import agent

await execa("npm", ["install", "mysql2"]); // install dependency
const mysql = await import("mysql2/promise"); // import dependency
try {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "exmp",
    password: "pswd",
    database: "exdb",
  });

  const [rows] = await conn.query("SELECT * FROM extb");
  fs.writeFileSync("db_dump.sql", JSON.stringify(rows));
  console.log("DB exported to database_dump.sql");

  await conn.end();
  // create an agent for a complex task
  const agent = getAgent(
    "Compress the db file 'db_dump.sql' into a .tar.gz archive.",
  );
  await agent(); // execute it
} catch (error) {
  console.error(`Error: ${error}`);
}
