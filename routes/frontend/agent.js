const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../db");
const { getAgentAll,  getAgentById, getAgentByIdcard, createAgent, update_newpassword, updateAgent, deleteAgent} = require("../../controllers/frontend/agent");

// ใช้ middleware เฉพาะ endpoint ที่ต้อง query DB
router.get("/get_agent_all", dbMiddleware, getAgentAll);
router.post("/get_agent", dbMiddleware, getAgentById);
router.post("/get_agent_idcard", dbMiddleware, getAgentByIdcard);
router.post("/update_newpassword", dbMiddleware, update_newpassword);

router.post("/create_agent", dbMiddleware, createAgent);
// router.get("/update_agent", dbMiddleware, updateAgent);

module.exports = router;