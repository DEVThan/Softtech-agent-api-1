const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../db");
const { getAll, getById, create, update, deleted} = require("../../controllers/frontend/user_interested");

// ใช้ middleware เฉพาะ endpoint ที่ต้อง query DB
router.get("/get_user_interested", dbMiddleware, getAll);
// router.get("/get_agent", dbMiddleware, getAgentById);
router.post("/create_user_interested", dbMiddleware, create);
// router.get("/update_agent", dbMiddleware, updateAgent);

module.exports = router;