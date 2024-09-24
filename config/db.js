const mysql = require("mysql2");

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mch3'
});

module.exports = con;

con.connect(function (err) {
    if (err) {
        console.error("Error connecting to the database:", err.stack);
        return;
    }
    console.log("Connected to the database.");
});