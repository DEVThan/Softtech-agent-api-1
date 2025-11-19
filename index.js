require('dotenv').config();
const express = require("express");
const cors = require("cors");


const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// อนุญาตทุก origin (สำหรับ dev)
app.use(cors());

// หรืออนุญาตเฉพาะ localhost:3000
// app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json()); // เพื่ออ่าน JSON body

app.use(bodyParser.json());



//### App ###//
const agentRoutes = require("./routes/frontend/agent");
app.use("/app", agentRoutes);



//### Admin ###//
const authenRoutes = require("./routes/backend/authen");
app.use("/admin", authenRoutes);

const profileRoutes = require("./routes/backend/profile");
app.use("/admin", profileRoutes);

const performanceRoutes = require("./routes/backend/performance");
app.use("/admin", performanceRoutes);

// // ✅ ใช้ express.json() แยก route อื่นที่เป็น JSON
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// const profileRoutes = require("./routes/backend/agent");
// app.use("/admin", profileRoutes);








// // ทดสอบ API
// app.get("/", (req, res) => {
//   res.send("Hello PostgreSQL API 🚀");
// });

// // ดึง user ตาม id
// app.get("/users/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// // เพิ่ม user
// app.post("/users", async (req, res) => {
//   try {
//     const { name, email } = req.body;
//     const result = await pool.query(
//       "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
//       [name, email]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// // แก้ไข user
// app.put("/users/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email } = req.body;
//     const result = await pool.query(
//       "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *",
//       [name, email, id]
//     );
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// // ลบ user
// app.delete("/users/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     await pool.query("DELETE FROM users WHERE id=$1", [id]);
//     res.json({ message: "User deleted" });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
