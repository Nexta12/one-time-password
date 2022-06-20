const router = require("express").Router();
const User = require("../models/User");
const UserOtpVerification = require("../models/UserOtpVerification");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "vm789.tmdcloud.eu",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "techsupport@revclient.com", // generated ethereal user
    pass: "Fivedots.....5", // generated ethereal password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

router.post("/signup", (req, res) => {
  let { name, email, password, dateOfBirth } = req.body;
  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  if (name == "" || email == "" || password == "" || dateOfBirth == "") {
    res
      .status(400)
      .json({ status: "Failed", message: "Provide all Input fields" });
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    // only a-z names allowed
    res.status(400).json({ status: "Failed", message: "Invalid Name entered" });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res
      .status(400)
      .json({ status: "Failed", message: "Invalid Email detected" });
  } else if (!new Date(dateOfBirth).getTime()) {
    res
      .status(400)
      .json({ status: "Failed", message: "Invalid Date of Birth Entered" });
  } else if (password.length < 6) {
    res.status(400).json({ status: "Failed", message: "Password too Short" });
  } else {
    // All validations passed
    // Now Check if user user exists.
    User.find({ email }).then((result) => {
      if (result.length) {
        //user already Exists
        res
          .status(409)
          .json({ status: "Failed", message: "User already Exists" });
      } else {
        // create another user
        // password handling
        const salt = 10;
        bcrypt
          .hash(password, salt)
          .then((hashedpassword) => {
            const newUser = new User({
              name,
              email,
              password: hashedpassword,
              dateOfBirth,
              verified: false,
            });

            newUser
              .save()
              .then((result) => {

                // handle account verification
                // sendVerificationEmail(result, res)
                sendOTPVerificationEmail(result, res);
              })
              .catch((err) => {
                console.log(err);
                res
                  .status(403)
                  .json({
                    status: "Failed",
                    message: "An Error Occured while saving this user",
                  });
              });
          })
          .catch((err) => {
            console.log(err);
            res
              .status(500)
              .json({
                status: "Failed",
                message: " An error Occured with the password",
              });
          });
      }
    });
  }
});

//send OTP verification Email
const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    
    // mail options
    const mailOptions = {
      from: '"OTPEmailServer"<info@next.io>',
      to: email,
      subject: "Verify Your Email",
      html: ` <p> Use this OTP:<b> ${otp} </b> to complete your registration </p> 
      <p> This OTP expires in 1 Hour</p>`,
    };

    const salt = 10;
    const newOtp = await bcrypt.hash(otp, salt);
   
    const newOTPVerification = await new UserOtpVerification({
      userId: _id,
      hashedOtp: newOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // + 1 hour in milliseconds
    });

    // save to Database
    await newOTPVerification.save();
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: "Pending",
      message: "Verification OTP Email Sent",
      data: {
        userId: _id,
        email,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

// Verify OTP

 router.post ("/verifyOTP", async (req, res)=>{
    
    try {

        let { userId, otp } = req.body;
      
        if(!userId || !otp ){
            throw new Error("Please Provide OTP details to continue")
        }else{
          const userOTPrecords =  await UserOtpVerification.find({userId})
          if(userOTPrecords.length <= 0 ){ // no record found
            throw new Error("Account is Invalid or Has been verified Already, please try Loggin in")

          }else{
              // record exists, check for the expiry
              const { expiresAt, hashedOtp } = userOTPrecords[0];  // extracting details from found records
      
              if(expiresAt < Date.now()){
                  // otp has expired 
                  await UserOtpVerification.deleteMany({userId}) // delete all details of the user
                  throw new Error("OTP has Expired, Please request for another")
              }else{
                  // code hasn't expired
                  //Then Verify the validity of the code.
                
                const validOTP = await bcrypt.compare(otp, hashedOtp); // this will return a Boolean Value
               
                if(!validOTP){
                   // OTP is wrong
                   throw new Error("OTP is Invalid")
                }else{
                    // Succes
                    console.log({otp: otp, userId: userId})
                    await User.updateOne({_id: userId}, {verified: true})
                    await UserOtpVerification.deleteMany({userId}) // delete records
                    res.status(200).json({status: "Success", message: "User Email Has been Verified Successfully"})
                }
              }
          }
        }
        
    } catch (error) {
        res.status(500).json({status: "Failed", message: error.message})
    }
 })


//  resend OTP Verification

 router.post("/resendOTP", async(req, res)=>{

  try {
     let { userId, email } = req.body;

     if(!userId || !email ){
       throw new Error("Empty Field are not Allowed")
     }else{
       // delete existing Record and resend a new one
        await UserOtpVerification.deleteMany({ userId })
        sendOTPVerificationEmail({_id: userId, email}, res)
     }
  } catch (error) {
    res.status(500).json({status: "Failed", message: error.message})
  }

  

 })

module.exports = router;
