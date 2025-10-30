const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../db");
const verifyToken = require("../../middleware/verifyToken");
const { get_all,  get_once, create, update, delete_performance_file} = require("../../controllers/backend/performance");

// Generate PerformanceCode
async function generatePerformanceCode(req, prefix) {
  const now = new Date();
  const year   = now.getFullYear();                  // ปี 4 หลัก
  const month  = String(now.getMonth() + 1).padStart(2, "0"); // เดือน 2 หลัก
  // const day    = String(now.getDate()).padStart(2, "0");      // วัน 2 หลัก
  // const hour   = String(now.getHours()).padStart(2, "0");     // ชั่วโมง 2 หลัก
  // const minute = String(now.getMinutes()).padStart(2, "0");   // นาที 2 หลัก
  // const second = String(now.getSeconds()).padStart(2, "0");   // วินาที 2 หลัก
  // return `${prefix}-${year}${month}${day}${hour}${minute}${second}`;

  const prefixCode = `${prefix}${year}${month}`; //  (prefix) + year + month
  const query = ` SELECT performancecode  FROM performance  WHERE performancecode LIKE '${prefixCode}%' ORDER BY performancecode DESC  LIMIT 1 `;
  const result = await req.pool.query(query);
  let runningNumber = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].performancecode;
    const lastRun = parseInt(lastCode.slice(-3), 10);// select 3 digit of last to running code
    runningNumber = lastRun + 1;
  }
  const run = String(runningNumber).padStart(3, "0");
  const code = `${prefixCode}${run}`;
  return  code;
}
// config storage
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const performance_storage_add = multer.diskStorage({
  destination: (req, file, cb) => {
    const agentcode = req.body.agentcode;
    const performancecode = req.performancecode || req.body.performancecode;
    const country = req.country || req?.header("country") || "en";
    const dir = path.join("uploads", "performance", country, agentcode, performancecode);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const performance_storage_edit = multer.diskStorage({
  destination: (req, file, cb) => {
    const agentcode = req.body.agentcode;
    const performancecode = req.body.performancecode;
    const country = req.country || req?.header("country") || "en";
    const dir = path.join("uploads", "performance", country, agentcode, performancecode);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});


const performanceupload_add = multer({ storage: performance_storage_add }).array("files", 5);
const performanceupload_edit = multer({ storage: performance_storage_edit }).array("files", 5);





// ใช้ middleware เฉพาะ endpoint ที่ต้อง query DB
router.post("/all_performance", verifyToken,  dbMiddleware, get_all);
router.post("/get_performance", verifyToken,  dbMiddleware, get_once);

// router.post("/create_performance", verifyToken,  dbMiddleware, performanceupload, create);
router.post("/create_performance", verifyToken, dbMiddleware, 
async (req, res, next) => {
  try {
    req.performancecode = await generatePerformanceCode(req, "");
    req.country = req?.header("country") || "en";
    next(); // to upload
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
},
performanceupload_add,
create);

router.post("/update_performance", verifyToken,  dbMiddleware, 
performanceupload_edit,
async (req, res, next) => {
  try {
    const { agentcode, performancecode } = req.body;
    req.performancecode = performancecode;
    req.agentcode = agentcode;
    req.country = req?.header("country") || "en";
    next(); // to upload
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
},
update);

router.post("/delete_performance_file", verifyToken,  dbMiddleware, delete_performance_file);



module.exports = router;