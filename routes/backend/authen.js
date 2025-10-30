const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../db");
const { login,  getAgentById, createAuthen, updateAgent, deleteAgent} = require("../../controllers/backend/authen");

// ใช้ middleware เฉพาะ endpoint ที่ต้อง query DB
router.post("/login", dbMiddleware, login);
// router.get("/get_agent", dbMiddleware, getAgentById);

// router.post("/create_authen", dbMiddleware, createAuthen);
// router.get("/update_agent", dbMiddleware, updateAgent);

module.exports = router;