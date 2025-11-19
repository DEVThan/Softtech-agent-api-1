
async function createAuthen(req, res) {
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
      res.status(201).json({
        status: true,
        message: "Successfully.",
        result: result.rows[0].agentcode
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

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
async function login(req, res) {
  try {
    
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (username, password)",
      });
    }

    const authen = await req.pool.query("SELECT * FROM agentauthen WHERE username = $1", [username]);
    if (authen.rows.length > 0) {
      const auth = authen.rows;
      const user = auth.find(u => u.username === username);
      if (!user) return res.status(200).json({ status: false, message: 'Username not found' });

      const isMatch = await bcrypt.compare(password, auth[0].password);
      if (!isMatch) return res.status(200).json({ status: false, message: 'Incorrect password' });

      const agent_result = await req.pool.query("SELECT * FROM agent WHERE agentcode = $1", [auth[0].agentcode]);
      if (agent_result.rows.length > 0) {
        const agent_res = agent_result.rows[0];
        // 🔹 สร้าง JWT Token
        const token = jwt.sign( {
            id: auth[0].id,
            username: auth[0].username,
            pass: auth[0].password,
            role: user.role || "admin",
            local: req.headers.country,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES || "1d" }
        );

        const result = {
          agentname : agent_res.agentname,
          agentsurname : agent_res.agentsurname,
          emailaddress : agent_res.emailaddress,
          telephone : agent_res.telephone,
          province : agent_res.province,
          thumnal : agent_res.thumnal,
          username : auth[0].username, 
          agentcode : auth[0].agentcode, 
          token, 
        }
        
        res.status(200).json({
          status: true,
          message: "successfully",
          result: result
        });
      }else{
        res.status(200).json({
          status: false,
          message: "Username not found",
          result: ''
        });
      }

    } else{
      res.status(200).json({
        status: false,
        message: "Username not found",
        result: ''
      });
    }
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

module.exports = {
  createAuthen,
  login
};
