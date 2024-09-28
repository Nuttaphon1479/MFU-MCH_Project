const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mch3",
});

module.exports = db;

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database.");
});
// con.connect(function (err) {
//     if (err) {
//         console.error("Error connecting to the database:", err.stack);
//         return;
//     }
//     console.log("Connected to the database.");
// });
