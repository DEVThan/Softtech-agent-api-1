
async function get_profile(req, res) {
  try {
    // console.log(req.body);
    const { agentcode } = req.body;
    if (!agentcode) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (agentcode)",
      });
    }

    const agent = await req.pool.query("SELECT * FROM agent WHERE agentcode = $1", [agentcode]);
    if (agent.rows.length > 0) {
      const result = agent.rows;
      res.status(200).json({
        status: true,
        message: "successfully",
        result: result
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

const path = require("path");
async function update_profile(req, res) {
  try {
    // console.log(req.body);
    const { 
      agentcode, agentname, agentsurname, emailaddress, telephone, 
      addr1, country, street, subdistrict, district, province, postalcode 
    } = req.body;
    const countries = req.country || "en";

    if (!agentcode || !agentname || !agentsurname) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields (agentcode, agentname, agentsurname)",
      });
    }

    await req.pool.query(
      `UPDATE agent  SET 
     
      agentname = $2, 
      agentsurname = $3, 
      emailaddress = $4, 
      telephone = $5, 
      addr1 = $6, 
      country = $7, 
      street = $8, 
      subdistrict = $9, 
      district = $10, 
      province = $11, 
      postalcode = $12
      WHERE agentcode = $1`,
      [agentcode, agentname, agentsurname, emailaddress, telephone, addr1, country, street, subdistrict, district, province, postalcode]
    );

    if (req.files && req.files.length > 0) {
      // เก็บ path ที่ใช้แสดงผลจริง
      let thumbnailPath = path.join( "uploads", "profile", countries, agentcode, req.files[0].filename );
      await req.pool.query( `UPDATE agent  SET  thumbnail = $2 WHERE agentcode = $1`, [agentcode, thumbnailPath] );
    }

    const agentresult = [];
    const agent = await req.pool.query(
      "SELECT agentcode, agentname, agentsurname, emailaddress, telephone, addr1,  province, postalcode, thumbnail FROM agent WHERE agentcode = $1", [agentcode]);
    if (agent.rows.length > 0) {
      const result = agent.rows;
      agentresult.push(...result);
    }

    res.status(200).json({
      status: true,
      message: "updated successfully",
      result: agentresult
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


module.exports = {
  get_profile,
  update_profile,
};
