const jwt = require("jsonwebtoken");
require("dotenv").config();

// function verifyToken(req, res, next) {
//   try {
//     const authHeader = req.headers["authorization"];

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         status: false,
//         message: "No token provided",
//       });
//     }

//     const token = authHeader.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({
//         status: false,
//         message: "Invalid token",
//       });
//     }

//     // ✅ ตรวจสอบ JWT
//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//       if (err) {
//         return res.status(403).json({
//           status: false,
//           message: "Expire or Invalid token",
//         });
//       }

//       // ✅ เก็บข้อมูลผู้ใช้ใน req
//       req.user = decoded;
//       next();
//     });
//   } catch (error) {
//     console.error("VerifyToken Error:", error);
//     res.status(500).json({ status: false, message: "Server Error" });
//   }
// }

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ status: false, message: "Invalid token" });
    }
    req.user = decoded; // เอาข้อมูลจาก token ใส่ req.user
    next();
  });
}

module.exports = verifyToken;
