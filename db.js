
require("dotenv").config();
const { Pool } = require("pg");

// ฟังก์ชันสร้าง Pool
function createPool(dbName) {
    return new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: dbName,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    });

    // return new Pool({
    //     user: "admin",
    //     host: "127.0.0.1",
    //     database: dbName,
    //     password: "StrongPassword123",
    //     port: 5432,
    // });
}

// ฟังก์ชันเลือกชื่อ DB
function resolveDbName(req) {
    const dbNameFromHeader = req?.header("country");
    switch (dbNameFromHeader) {
        case "en": return process.env.DB_NAME_EN;
        case "mm": return process.env.DB_NAME_MM;
        case "th": return process.env.DB_NAME_TH;
        default: return process.env.DB_NAME_TH; // fallback
    }

    // switch (dbNameFromHeader) {
    //     case "en": return "STN_CRM_EN";
    //     case "mm": return "STN_CRM_MM";
    //     case "th": return "STN_CRM_TH";
    //     default: return "STN_CRM_TH"; // fallback
    // }
}


// Middleware
function dbMiddleware(req, res, next) {
    const dbName = resolveDbName(req);
    if (!dbName) {
        return res.status(400).json({ error: "Database name not resolved" });
    }
    req.pool = createPool(dbName);
    next();
}

module.exports = dbMiddleware;
