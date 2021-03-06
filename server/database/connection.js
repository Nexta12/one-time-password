const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    let conn = mongoose.connect("mongodb://localhost/otpsender");
    console.log(`Server connected to Database`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
