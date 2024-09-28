const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// const dbConnection = require('./database');
// const { body, validationResult } = require('express-validator');
// const cookieSession = require('cookie-session');
// app.use(express.urlencoded({ extended: false}))

// -------database connection--------
const con = require("./config/db");
const { name } = require("ejs");
// const { check } = require("express-validator");

const sessionStore = new MySQLStore(Options);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    secret: "Todayistooearlytolearn",
    resave: false,
    saveUninitialized: true,
    store: new sessionStore({
      checkPeriod: 24 * 60 * 0 * 1000,
    }),
  })
);

// --------for json change--------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------- Login ------------------
// app.post("/login", function (req, res) {
//     const username = req.body.username;
//     const password = req.body.password;

//     if (username == "admin" && password == "1234") {
//         res.send("Login success");
//     }
//     else {
//         res.status(401).send("login failed");
//     }
//     // res.sendFile(path.join(__dirname, "view/login.html"));
// });

// ------------หน้า Login------------------
app.get("/login", function (_req, res) {
  res.sendFile(path.join(__dirname, "view/login.html"));
});

// ------------- ดึงข้อมูล Login -------------------
app.post("/login", function (req, res) {
  const { username, password } = req.body;
  // const sql = "SELECT user_id, user_name FROM user WHERE user_name = ? AND password = ?";
  // SQL Query สำหรับค้นหาข้อมูลผู้ใช้ในฐานข้อมูล
  const sql = "SELECT * FROM users WHERE user_name=?";
  con.query(sql, [username], function (err, results) {
    if (err) {
      console.error(err);
      res.status(500).send("DB error");
      // ตรวจสอบว่ามีผลลัพธ์หรือไม่ (ชื่อผู้ใช้ถูกต้องหรือไม่)
    } else if (results.length != 1) {
      res.status(400).send("Wrong username ");
    } else {
      // เปรียบเทียบรหัสผ่านที่ส่งมาจากฟอร์มกับรหัสผ่านที่เก็บในฐานข้อมูล (ใช้ bcrypt)
      bcrypt.compare(password, results[0].password, function (err, same) {
        if (err) {
          res.status(500).send("Password error");
        } else {
          if (same) {
            // รหัสผ่านถูกต้อง เก็บข้อมูลลงใน session
            res.session.name = results[0].name;
            res.session.user_name = results[0].user_name;
            res.session.user_id = results[0].user_id;
            res.session.role = results[0].role;
            res.send("/user/dashuser1");
          } else {
            res.status(400).send("Wrong password");
          }
        }
      });
    }

    // bcrypt.compare(password, results[0].password, function (err, same) {
    //     if (err) {
    //         return res.status(503).send("Authentication server error");
    //     }
    //     else if (same) {
    //         //correct login send destination URL to client
    //         res.status(200).send("/dashadmin");
    //     }
    //     else {
    //         //wrong password
    //         res.status(400).send("Wrong password");
    //     }
    // });
  });
});

// --------------- เช็ค Password ----------------
// app.get("/password/:pass", function (req, res) {
//   // const username = req.params.username;
//   const password = req.params.pass;
//   const saltRounds = 10; //the cost of encrypting see https://github.com/ kelektiv / node.bcrypt.js#a - note - on - rounds

//   bcrypt.hash(password, saltRounds, function (err, hash) {
//     if (err) {
//       return res.status(500).send("Hashing error");
//     }
// const sql = "INSERT INTO user (user_name, password) VALUES (?,?)";
// con.query(sql, [username, hash], function (err, result) {
//     if (err) {
//         return res.status(500).send("Database insert error");
//     }
//     res.send("User registered successfully");
// });
// return hashed password, 60 characters
// console.log(hash.length);
// res.send(hash);
//   });
// });

// ------------------ Logout ------------------
// app.get('/logout', function (req, res) {
//   req.session.destroy(function (err) {
//       if (err) {
//           return res.status(500).send('Session error');
//       }
//       res.redirect('/');
//   })
// });

// Call
app.get("/user", function (req, res) {
  res.json({
    user_id: req.session.user_id,
    name: req.session.name,
    user_name: req.session.user_name,
    role: req.session.role,
  });
});

// ------------หน้า Register---------------
app.get("/register", function (_req, res) {
  res.sendFile(path.join(__dirname, "view/register.html"));
});

app.post("/register", function (req, res) {
  const { username, email, password, repassword} = req.body;
  if (password != repassword) {
    return res.status(400).send("Password not match");
  }
  // ถ้าไม่มี username ซ้ำกัน ให้ทำการเข้ารหัสรหัสผ่าน (bcrypt)
  bcrypt.hash(password, 10, function (err, hash) {
    if (err) {
      return res.status(500).send("Hash error");
    } else {
      const findusername = "SELECT username FROM users WHERE username =?";
      con.query(findusername, [username], function (err, results) {
        if (err) {
          console.error(err);
          res.status(500).send("DB error");
          // ถ้าพบว่ามี username ซ้ำกัน
        } else if (results.length > 0) {
          res.status(400).send("Username has already exist");
        } else {
          const sql =
            "INSERT INTO users(name, user_name, password, role) VALUE(?,?,?, 'user_id')";
          con.query(sql, [name, username, email, hash], function (err, results) {
            if (err) {
              console.error(err);
              res.status(500).send("DB error");
            } else {
              // หลังจากสมัครสำเร็จให้ redirect ไปยังหน้า login
              res.send("/login");
            }
          });
        }
      });
    }
  });
});

// ---------------------------Role User----------------------------------------
// app.post("/login", function (req, res) {
//     const username = req.body.username;
//     const password = req.body.password;
//     const sql = "SELECT id, username, role FROM user WHERE username = ? AND password = ? ";

//     con.query(sql, [username, password], function (err, results) {
//         if (err) {
//             return res.status(500).send("Database server error");
//         }
//         if (results.length != 1) {
//             return res.status(401).send("Wrong username or password");
//         }
//         res.send("Login successful");
//     });
// });

// ------------หน้า DashUser1---------------
app.get("/user/dashuser1", function (req, res) {
  if (req.session.role == "user") {
    res.sendFile(path.join(__dirname, "view/User/DashUser1.html"));
  } else {
    res.redirect("/login");
  }
});

// ------------หน้า DashUser2---------------
app.get("/user/dashuser2", function (req, res) {
  if (req.session.role == "user") {
    res.sendFile(path.join(__dirname, "view/User/DashUser2.html"));
  } else {
    res.redirect("/login");
  }
});

// ------------หน้า StatusUser---------------
app.get("/user/statususer", function (req, res) {
  if (req.session.role == "user") {
    res.sendFile(path.join(__dirname, "view/User/StatusUser.html"));
  } else {
    res.redirect("/login");
  }
});

// ------------หน้า ReportUser---------------
app.get("/user/reportuser", function (req, res) {
  if (req.session.role == "user") {
    res.sendFile(path.join(__dirname, "view/User/ReportUser.html"));
  } else {
    res.redirect("/login");
  }
});

// ---------------------------Role Admin----------------------------------------
// ------------หน้า DashAdmin---------------
app.get("/dashadmin", function (_req, res) {
  if (req.session.role == "admin") {
    res.sendFile(path.join(__dirname, "view/Admin/DashAdmin.html"));
  } else {
    res.redirect("/login");
  }

  // const sql = "SELECT * FROM ระบบงานหลัก";
  // con.query(sql, function (err, results) {
  //     if (err) {
  //         console.error(err);
  //         return res.status(500).send("Database server error");
  //     }
  //     res.json(results);
  // });
});

// ----------- ดึงระบบใน Dashadmin ----------------
app.get("/data", function (_req, res) {
  const sql = "SELECT * FROM ระบบงานหลัก";
  con.query(sql, function (err, results) {
    if (err) {
      console.error(err);
      res.status(500).send("DB server error");
    } else {
      res.status(200).json(results);
    }
  });
});

// ------------หน้า RequestAdmin---------------
app.get("/admin/requestadmin", function (req, res) {
  if (req.session.role == "admin") {
    res.sendFile(path.join(__dirname, "view/Admin/Request.html"));
  } else {
    res.redirect("/login");
  }
});

// ------------หน้า ReportAdmin---------------
app.get("/admin/reportadmin", function (req, res) {
  if (req.session.role == " admin") {
    res.sendFile(path.join(__dirname, "view/Admin/ReportAdmin.html"));
  } else {
    res.redirect("/login");
  }
});

// ------------หน้า Report2Admin---------------
app.get("/admin/report2admin", function (req, res) {
  if (req.session.role == "admin") {
    res.sendFile(path.join(__dirname, "view/Admin/Report2Admin.html"));
  } else {
    res.redirect("/login");
  }
});

app.use;

// ---------------- ข้อมูล user -------------
app.get("/user", function (req, res) {
  res.json({
    name: req.session.name,
    user_name: req.session.user_name,
    role: req.session.role,
  });
});

// ------------- Root service ---------------
app.get("/", function (req, res) {
  if (req.session.role == "user") {
    res.redirect("/user/itemlist");
  }
  if (req.session.role == "admin") {
    res.redirect("/admin");
  }
  res.sendFile(path.join(__dirname, "view/login.html"));
});

app.listen(port, function () {
  console.log("Server is ready at " + port);
});
