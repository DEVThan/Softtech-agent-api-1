const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../db");
// const verifyToken = require("../../middleware/verifyToken");
const verifyToken = require("../../middleware/verifyToken");
const { get_profile,  getAgentById, update_profile, deleteprofile} = require("../../controllers/backend/profile");


// config storage
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const BASE_UPLOAD_PATH = process.env.UPLOAD_PATH; // from .env
const thumnal_storage_add = multer.diskStorage({
  destination: (req, file, cb) => {
    const agentcode = req.agentcode || req.body.agentcode;
    const country = req.country || req?.header("country") || "th";
    // const dir = path.join("uploads", "profile", country, agentcode);
    const dir = path.join(BASE_UPLOAD_PATH, "uploads", country, "agent", agentcode, "profile");

    // ✅ delete old files
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            fs.unlinkSync(path.join(dir, f));
        }
    } else {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const thumnalupload_add = multer({ storage: thumnal_storage_add }).array("thumnal", 1);


// ใช้ middleware เฉพาะ endpoint ที่ต้อง query DB
router.post("/get_profile", verifyToken,  dbMiddleware, get_profile);
router.post("/update_profile", verifyToken,  dbMiddleware, 
async (req, res, next) => {
  try {
    // const { agentcode } = req.body;
    
    // req.agentcode = agentcode;
    req.country = req?.header("country") || "en";
    next(); // to upload
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
},
thumnalupload_add,
update_profile);
// router.get("/get_agent", dbMiddleware, getAgentById);

// router.post("/create_authen", dbMiddleware, createAuthen);
// router.get("/update_agent", dbMiddleware, updateAgent);

module.exports = router;