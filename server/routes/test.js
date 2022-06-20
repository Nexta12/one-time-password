const router = require("express").Router();
const bcrypt = require('bcrypt')

async function getCustomers() {
  
  
  
   const otp = ` ${Math.floor(1000 + Math.random() * 9000)}`;

    const salt = 10;
    const newcode = await bcrypt.hash(otp, salt);

    const decrupt = await bcrypt.compare(otp, newcode);
    
}
getCustomers();

module.exports = router;
