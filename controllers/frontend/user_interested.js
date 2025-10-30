// GET users
async function getAll(req, res) {
  try {
    const result = await req.pool.query("SELECT * FROM user_interested ORDER BY create_date ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// GET user by id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await req.pool.query("SELECT * FROM user_interested WHERE id = $1", [id]);
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

// CREATE user
function generateCode(prefix) {
  const now = new Date();
  const year   = now.getFullYear();                  // ปี 4 หลัก
  const month  = String(now.getMonth() + 1).padStart(2, "0"); // เดือน 2 หลัก
  const day    = String(now.getDate()).padStart(2, "0");      // วัน 2 หลัก
  const hour   = String(now.getHours()).padStart(2, "0");     // ชั่วโมง 2 หลัก
  const minute = String(now.getMinutes()).padStart(2, "0");   // นาที 2 หลัก
  const second = String(now.getSeconds()).padStart(2, "0");   // วินาที 2 หลัก

  return `${prefix}-${year}${month}${day}${hour}${minute}${second}`;
}

async function create(req, res) {
  try {
    const { 
      idcard, firstName, surname, phonenumber, email, 
      //address, street, country, subdistrict, district, province, postalcode,
      work_address, work_district, work_province, work_postalcode,
    } = req.body;
    
    const str = `INSERT INTO user_interested (
        idcard, firstname, surname, phonenumber, email, work_address, work_district, work_province, work_postalcode, create_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING * `;
    const result = await req.pool.query(str, [
      idcard, firstName, surname, phonenumber, email, work_address, work_district, work_province, work_postalcode, new Date()
    ]);

    if(result.rows.length > 0){
      res.status(201).json({
        status: true,
        message: "Successfully.",
        result: {
          id: result.rows[0].id,
          idcard: result.rows[0].idcard
        }
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
    //console.error(err.message);
    //res.status(500).send("DB Error");
  } finally {
    req.pool.end();
  }
}

// UPDATE user
async function update(req, res) {
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
async function deleted(req, res) {
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
  getAll,
  getById,
  create,
  update,
  deleted,
};
