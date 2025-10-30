
async function get_all(req, res) {
  try {
    // console.log(req.body);
    const { agentcode } = req.body;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 50;
    const offset = (page - 1) * limit;

    if (!agentcode ) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (agentcode)",
      });
    }

    const performanceResult = await req.pool.query(
      `SELECT performancecode, agentcode, name, description 
      FROM performance 
      WHERE agentcode = $1 
      ORDER BY createdate DESC
      LIMIT $2 OFFSET $3`, 
      [agentcode, limit, offset]
    );
    const totalResult = await req.pool.query( `SELECT COUNT(*) AS total FROM performance  WHERE agentcode = $1`,  [agentcode] );
    
    if (performanceResult.rows.length > 0) {
      const totalItems = parseInt(totalResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);
      const result = await Promise.all(
        performanceResult.rows.map(async (p) => {
          const fileResult = await req.pool.query( 
            "SELECT id, path FROM performance_file WHERE performancecode = $1", 
            [p.performancecode] );
          return {
            ...p,
            files: fileResult.rows
          };
        })
      );

      return res.status(200).json({
        status: true,
        message: "successfully",
        result: result,
        totalItems: totalItems,
        totalPages :totalPages,
        currentPage: page,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Performance not found" });
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "DB Error.",
      result: err.message
    });
  } finally {
    // req.pool.end();
  }
}
async function get_once(req, res) {
  try {
    // console.log(req.body);
    const { agentcode, performancecode } = req.body;
    if (!performancecode || !agentcode ) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (performancecode, agentcode)",
      });
    }

    const performanceResult = await req.pool.query(
      "SELECT performancecode, agentcode, name, description FROM performance WHERE performancecode = $1 AND agentcode = $2", 
      [performancecode, agentcode]);
    if (performanceResult.rows.length > 0) {
      const result = await Promise.all(
        performanceResult.rows.map(async (p) => {
          const fileResult = await req.pool.query( 
            "SELECT path FROM performance_file WHERE performancecode = $1", 
            [p.performancecode] );
          return {
            ...p,
            files: fileResult.rows
          };
        })
      );

      return res.status(200).json({
        status: true,
        message: "successfully",
        result: result
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Performance not found" });
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "DB Error.",
      result: err.message
    });
  } finally {
    // req.pool.end();
  }
}

// Generate PerformanceCode
// async function generatePerformanceCode(req, prefix) {
//   const now = new Date();
//   const year   = now.getFullYear();                  // ปี 4 หลัก
//   const month  = String(now.getMonth() + 1).padStart(2, "0"); // เดือน 2 หลัก
//   // const day    = String(now.getDate()).padStart(2, "0");      // วัน 2 หลัก
//   // const hour   = String(now.getHours()).padStart(2, "0");     // ชั่วโมง 2 หลัก
//   // const minute = String(now.getMinutes()).padStart(2, "0");   // นาที 2 หลัก
//   // const second = String(now.getSeconds()).padStart(2, "0");   // วินาที 2 หลัก
//   // return `${prefix}-${year}${month}${day}${hour}${minute}${second}`;

//   const prefixCode = `${prefix}${year}${month}`; //  (prefix) + year + month
//   const query = ` SELECT agentcode  FROM agent  WHERE agentcode LIKE '${prefixCode}%' ORDER BY agentcode DESC  LIMIT 1 `;
//   const result = await req.pool.query(query);
//   let runningNumber = 1;
//   if (result.rows.length > 0) {
//     const lastCode = result.rows[0].agentcode;
//     // ตัดเอาเลข 3 หลักท้ายมาทำเป็นเลขรัน
//     const lastRun = parseInt(lastCode.slice(-3), 10);
//     runningNumber = lastRun + 1;
//   }
//   const run = String(runningNumber).padStart(3, "0");
//   const code = `${prefixCode}${run}`;
//   return  code;
// }
async function create(req, res) {
  try {
    const { performancecode } = req; 
    const { agentcode, name, desc } = req.body;
    if (!name) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (name)",
      });
    }
    const now = new Date();
    await req.pool.query(
      `INSERT INTO performance (
        performancecode, agentcode, name, description, createdate, updatedate
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING * `,
      [performancecode, agentcode, name, desc, now, now]
    );


    // insert all file
    if (req.files && req.files.length > 0) {
      const insertValues = req.files.map((file) => [
        performancecode,
        file.path,
        now,
      ]);

      const queryText = `
        INSERT INTO performance_file (performancecode, path, createdate)
        VALUES ${insertValues.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(", ")}
        RETURNING *;
      `;
      const queryParams = insertValues.flat();
      const fileResult = await req.pool.query(queryText, queryParams);

      return res.json({
        status: true,
        message: "Performance created successfully",
        // performance: performanceResult.rows[0],
        // files: fileResult.rows,
      });
    }
    res.status(200).json({
      status: true,
      message: "create successfully",
      result: ''
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "DB Error.",
      result: err.message
    });
  } finally {
    // req.pool.end();
  }
}

// import ExifReader from 'exifreader';
const ExifReader = require('exifreader');
async function update(req, res) {
  try {
    const { performancecode, agentcode, name, desc } = req.body;
    if (!performancecode || !agentcode || !name) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (performancecode, agentcode, name)",
      });
    }

    const now = new Date();
    await req.pool.query(
      `UPDATE performance  SET 
      name = $3, 
      description = $4, 
      updatedate = $5
      WHERE performancecode = $1 AND  agentcode = $2 ` ,
      [performancecode, agentcode, name, desc, now]
    );

    // insert all file with EXIF
    const insertValues = [];
    for (const file of req.files) {
      let lat = null;
      let long = null;
      try {
        const buffer = fs.readFileSync(file.path);
        const tags = ExifReader.load(buffer);
        if (tags.GPSLatitude && tags.GPSLongitude) {
          const toDecimal = (gpsArray, ref) => {
            const decimalArray = gpsArray.map(val => {
              if (typeof val === "object" && val.numerator && val.denominator) {
                return val.numerator / val.denominator;
              }
              return parseFloat(val);
            });

            const [deg, min, sec] = decimalArray;
            let decimal = deg + min / 60 + sec / 3600;
            if (ref === "S" || ref === "W") decimal = -decimal;
            return decimal;
          };

          // ใช้จริง
          if (tags.GPSLatitude && tags.GPSLongitude) {
            lat = toDecimal(tags.GPSLatitude.value, tags.GPSLatitudeRef.value);
            long = toDecimal(tags.GPSLongitude.value, tags.GPSLongitudeRef.value);
            // console.log("LAT:", lat, "LONG:", long);
          }

          // console.log("✅ LAT:", lat, "LONG:", long);
        } else {
          // console.warn("⚠️ ไม่มีข้อมูล GPS ในภาพนี้");
        }
      } catch (err) {
        // console.warn("❌ อ่าน EXIF ไม่ได้:", err.message);
      }

      insertValues.push([performancecode, file.path, lat, long, now]);
    }
    const placeholders = insertValues
    .map((_, rowIndex) => {
      const offset = rowIndex * 5;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
    })
    .join(", ");

    const queryText = `
      INSERT INTO performance_file (performancecode, path, lat, long, createdate)
      VALUES ${placeholders}
      RETURNING *;
    `;
    const fileResult = await req.pool.query(queryText, insertValues.flat());

    res.status(200).json({
      status: true,
      message: "updated successfully",
      result: ''
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "DB Error.",
      result: err.message
    });
    //console.error(err.message);
    //res.status(500).send("DB Error");
  } finally {
    // req.pool.end();
  }
}

const fs = require("fs");
async function delete_performance_file(req, res) {
  try {
    
    const { performancecode, fileid, filepath } = req.body;
    if (!performancecode || !fileid || !filepath) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (performancecode, fileid, fileid)",
      });
    }

    console.log(performancecode , fileid, filepath);

    // สร้าง path ของไฟล์ที่ต้องการลบ
    // const filePath = path.join(
    //   "uploads",
    //   "performance",
    //   agentcode,
    //   performancecode,
    //   filename
    // );

    
    const now = new Date();
    await req.pool.query( `DELETE FROM performance_file  WHERE id = $1 AND performancecode = $2`, [fileid, performancecode] );
    
    // delete file
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        status: false,
        message: "File not found",
      });
    }
    fs.unlinkSync(filepath);
    res.status(200).json({
      status: true,
      message: "remove successfully",
      result: ''
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "DB Error.",
      result: err.message
    });
  } finally {
    // req.pool.end();
  }
}

module.exports = {
  get_all,  get_once, create, update,
  delete_performance_file
};
