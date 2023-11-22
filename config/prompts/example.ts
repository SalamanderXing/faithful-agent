import fs from "fs";
import { execa } from "execa";
import Agent from "./agent"; // import agent


await execa("npm", ["install", "mysql2"]); // install dependency
const mysql = await import("mysql2/promise"); // import dependency using dynamic import!!
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
  const agent = new Agent(
    { task: "Compress the db file 'db_dump.sql' into a .tar.gz archive." },
  );
  await agent.run();
} catch (error) {
  const handlingErrorAgent = new Agent(
    {
      task:
        "I was executing the task 'Compress the db file 'db_dump.sql' into a .tar.gz archive.' but I got an error. Try to solve it in a different way according to the error log in the input.",
      input: { error: String(error) },
    },
  );
  await handlingErrorAgent.run();
}
