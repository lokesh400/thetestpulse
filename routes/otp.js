const express = require("express");
const router = express.Router();
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator'); 
const { isLoggedIn } = require('../middlewares/login');
require('dotenv').config();

const Otp = require('../models/Otp');
const userTeacher = require("../models/userTeacher");


router.post('/new/send-otp', async (req, res) => {
    const { email } = req.body;

    const otp = otpGenerator.generate(6, { 
        digits: true, 
        upperCaseAlphabets: false, 
        lowerCaseAlphabets: false, 
        specialChars: false 
    });
    
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    try {

        const transporter = nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            secure:false,
            port:587,
            auth:{
             user:"lokeshbadgujjar401@gmail.com",
             pass:process.env.mailpass
            }
           });
        
           try{
              const mailOptions = await transporter.sendMail({
                from:"lokeshbadgujjar401@gmail.com",
                to: `${email}`,
                subject: 'Your OTP Code',
                text: `your otp to create your account is ${otp}`,
            });
           } catch(error){
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.log(error)
                }
                else{
                    console.log(info+response);
                }
            })
        }

        
        let user = await Otp.findOne({ email });
        if (!user) {
            // If user does not exist, create a new entry
            user = new Otp({ email, otp, otpExpiration: expirationTime });
        } else {
            // If the user already exists, just update the OTP and expiration
            user.otp = otp;
            user.otpExpiration = expirationTime;
        }
        await user.save();
        // Send OTP via email (this part is not shown)
        res.json({ message: 'OTP sent to your email.' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP.' });
    }
});

// FORGET PASSWORD OTP SEND
router.post('/otp/forget-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userTeacher.findOne({ username:email });
    if (!user) {
      return res.status(404).json({ message: 'No registered account with this email.' });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });

    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Send OTP Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: "lokeshbadgujjar401@gmail.com",
        pass: process.env.mailpass
      }
    });

    const mailOptions = {
      from: '"The Test Pulse" <lokeshbadgujjar401@gmail.com>',
      to: user.email,
      subject: 'Your OTP Code',
      text: `Dear TTPian,\n\nHere is your OTP to reset your password for ${email}:\n\nOTP: ${otp}\n\nThis OTP will expire in 5 minutes.\n\n- The Test Pulse Team`
    };

    await transporter.sendMail(mailOptions);

    // Save or update OTP in DB
    let otpRecord = await Otp.findOne({ email:user.email });
    if (!otpRecord) {
      otpRecord = new Otp({ email:user.email, otp, otpExpiration: expirationTime });
    } else {
      otpRecord.otp = otp;
      otpRecord.otpExpiration = expirationTime;
    }

    await otpRecord.save();

    req.flash('success_msg', 'OTP sent to your email.');
    res.status(200).json({ message: `OTP sent to your registered mail \n Email: ${user.email}` });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP. Please try again later.' });
  }
});


module.exports = router;