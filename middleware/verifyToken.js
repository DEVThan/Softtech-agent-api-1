const jwt = require("jsonwebtoken");
require("dotenv").config();

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ status: false, message: "Invalid token" });
    }else{
      if(decoded.local != req.headers["country"]){
        return res.status(403).json({ status: false, message: "Invalid token" });
      }else{
        req.user = decoded;
        next();
      }
    }
  });
}

module.exports = verifyToken;
