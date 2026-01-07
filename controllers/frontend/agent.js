// GET users
async function getAgentAll(req, res) {
  try {
    const result = await req.pool.query("SELECT * FROM agent ORDER BY agentcode ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// GET user by id
async function getAgentById(req, res) {
  try {
    const { id } = req.params;
    const result = await req.pool.query("SELECT * FROM agent WHERE agentcode = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// GET user by idcard
async function getAgentByIdcard(req, res) {
  try {
    const { idcard } = req.body;
    const result = await req.pool.query("SELECT cardno FROM agent WHERE cardno = $1", [idcard]);
    if (result.rows.length === 0) {
      return res.status(200).json({
        status: false,
        message: "ID Card Number/Passport not found.",
        result: ""
      });
    }else{
    return res.status(200).json({
        status: true,
        message: "Successfully.",
        // result: result.rows[0].agentcode
        result: result.rows[0]
      });
    }
    // res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// UPDATE password
async function update_newpassword(req, res) {
  try {
    const {idcard, password } = req.body;
    const sqlstr = `SELECT agentauthen.id, agentauthen.agentcode
    FROM agent 
    LEFT JOIN agentauthen ON agent.agentcode = agentauthen.agentcode
    WHERE agent.cardno = $1`;
    const agentauthenesult = await req.pool.query(sqlstr, [idcard]);
    if (agentauthenesult.rows.length > 0) {
      let result_agent = agentauthenesult.rows[0];

      // const hashedPassword = await bcrypt.hash(password, 10);
      const hashedPassword = password;
      
      const result = await req.pool.query(
        "UPDATE agentauthen SET password = $1, updatedate = $2 WHERE id = $3 AND agentcode = $4 RETURNING *",
        [hashedPassword, new Date(), result_agent.id, result_agent.agentcode]
      );
      result.rows[0].password = password;
      return res.status(200).json({
        status: true,
        message: "Password updated successfully.",
        result: result.rows[0]
      });
    }else{
      return res.status(200).json({
        status: false,
        message: "ID Card Number/Passport already in use.",
        result: ""
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// CREATE user
async function generateAgentCode(req, prefix) {
  const now = new Date();
  const year   = now.getFullYear();                  // ปี 4 หลัก
  const month  = String(now.getMonth() + 1).padStart(2, "0"); // เดือน 2 หลัก
  // const day    = String(now.getDate()).padStart(2, "0");      // วัน 2 หลัก
  // const hour   = String(now.getHours()).padStart(2, "0");     // ชั่วโมง 2 หลัก
  // const minute = String(now.getMinutes()).padStart(2, "0");   // นาที 2 หลัก
  // const second = String(now.getSeconds()).padStart(2, "0");   // วินาที 2 หลัก
  // return `${prefix}-${year}${month}${day}${hour}${minute}${second}`;

  const prefixCode = `${prefix}${year}${month}`; // เลขนำหน้า (prefix) + ปี + เดือน
  const query = ` SELECT agentcode  FROM agent  WHERE agentcode LIKE '${prefixCode}%' ORDER BY agentcode DESC  LIMIT 1 `;
  const result = await req.pool.query(query);
  let runningNumber = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].agentcode;
    // ตัดเอาเลข 5 หลักท้ายมาทำเป็นเลขรัน
    const lastRun = parseInt(lastCode.slice(-3), 10);
    runningNumber = lastRun + 1;
  }
  const run = String(runningNumber).padStart(3, "0");
  const code = `${prefixCode}${run}`;
  return  code;
}
async function createAuthen(req) {
  try {
    const { agentcode, username, password } = req.body;

    if (!agentcode || !username || !password) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (agentcode, username, password)",
      });
    }
    
    const str = `INSERT INTO agentauthen ( agentcode, username, password, createdate, updatedate ) VALUES ($1, $2, $3, $4, $5) RETURNING * `;
    const result = await req.pool.query(str, [
      agentcode, username, password,  new Date(), new Date()
    ]);

    if(result.rows.length > 0){
        return {
            status: true,
            message: "Successfully.",
            result: result.rows[0],
        };
    }else{
      return {
        status: false,
        message: "un successfully.",
        result: ''
        };
    }
  } catch (err) {
    return {
        status: false,
        message: "DB Error.",
        result: err.message
    };
  } finally {
    // req.pool.end();
  }
}

// const auThenModule = require("./authen");
const bcrypt = require('bcryptjs');
async function createAgent(req, res) {
  try {
    const { 
      idcard, firstName, surname, phonenumber, email, 
      address, district, province, postalcode, lat, lng
      //work_street, work_country, work_subdistrict, 
    } = req.body;

    //## dupplicate ###//
    const dupp_result = await req.pool.query(`SELECT cardno FROM agent WHERE cardno = $1`, [idcard]);
    if (dupp_result.rows.length > 0) {
      return res.status(200).json({
        status: false,
        message: "ID Card Number/Passport already in use.",
        result: ""
      });
    }

    // const dupp_phonenumber = await req.pool.query(`SELECT cardno FROM agent WHERE telephone = $1`, [phonenumber]);
    // if (dupp_phonenumber.rows.length > 0) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "Phone number already in use.",
    //     result: ""
    //   });
    // }

    const agentCode = await generateAgentCode(req, "");
    const str = `INSERT INTO agent (
        agentcode, cardno, agentname, agentsurname, telephone, emailaddress, addr1, district, province, postalcode, lat, lng
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING * `;
    const result = await req.pool.query(str, [ agentCode, idcard, firstName, surname, phonenumber, email, address, district, province, postalcode, lat, lng ]);

    if(result.rows.length > 0){
      // สร้างข้อมูลในตาราง authen
      // const hashedPassword = await bcrypt.hash(agentCode, 10);
      const hashedPassword = agentCode;
      const authenReq = {
        ...req,
        body: {
          agentcode: agentCode,
          username: agentCode,
          password: hashedPassword
        }
      }
      const authentication = await createAuthen(authenReq);
      res.status(201).json({
        status: true,
        message: "Successfully.",
        // result: result.rows[0].agentcode
        result: authentication.result
      });
    }else{
      res.status(404).json({
        status: false,
        message: "un successfully.",
        result: ''
      });
    }
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

// UPDATE user
async function updateAgent(req, res) {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const result = await req.pool.query(
      "UPDATE agent SET name = $1, email = $2 WHERE agentcode = $3 RETURNING *",
      [name, email, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// DELETE user
async function deleteAgent(req, res) {
  try {
    const { id } = req.params;
    const result = await req.pool.query("DELETE FROM agent WHERE agentcode = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted", deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

module.exports = {
  getAgentAll,
  getAgentById,
  getAgentByIdcard,
  update_newpassword,
  createAgent,
  updateAgent,
  deleteAgent,
};
