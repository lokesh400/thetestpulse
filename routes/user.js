const express = require("express");
const router = express.Router();
const User = require('../models/User');
const passport = require("passport");
const nodemailer = require('nodemailer');
const passportLocalMongoose = require('passport-local-mongoose');
const Otp = require('../models/Otp');
const forgetOtp = require('../models/forgetOtp');
const {isLoggedIn, saveRedirectUrl, isAdmin} = require('../middlewares/login');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }

// Signup route
router.get('/signup', (req, res) => {
    req.flash('error_msg', 'Hello Dear');
    res.render("./users/signup.ejs");
});

router.post('/signup', async (req, res) => {
    const {name,email, password ,confirmpassword,otp,contactNumber} = req.body;
    const role = "student";
    const username = email;
    let user = await Otp.findOne({ email });
    if(password==confirmpassword&&otp==user.otp){
        const newUser = new User({name,role, email, username,contactNumber });
    try {
        // Attempt to register the new user
        const registeredUser = await User.register(newUser, password);
        //sendimg greeting mail

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
                subject: 'Welcome to TheTestPulseFamily',
                text: `Dear ${name} welcome to TheTestPulse Family.`,
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
        // Redirect to login page after successful registration
        res.redirect('/user/login');
    } catch (error) {
        console.error(error);
        // Render signup page with an error message
        req.flash('error_msg', error.message);
        res.render("./users/signup.ejs");
    }
    }
    else{
        res.render("./users/signup.ejs", {error : "password do not match"});
    } 
});

// Login route
router.get("/login", (req, res) => {
    req.flash('error_msg', 'Welcome back');
    res.render("./users/login.ejs");
});

router.post("/login", saveRedirectUrl, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Error during authentication:", err);
      req.flash("error_msg", "Something went wrong. Please try again.");
      return res.redirect("/user/login");
    }

    if (!user) {
      req.flash("error_msg", info?.message || "Invalid credentials.");
      console.log("Login failed:", info?.message);
      return res.redirect("/user/login");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Login failed:", err);
        req.flash("error_msg", "Login failed. Please try again.");
        return res.redirect("/user/login");
      }

      req.flash("success_msg", "Successfully logged in!");
      return res.redirect(res.locals.RedirectUrl || "/admin");
    });
  })(req, res, next);
});

// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/"); // Redirect to homepage after logout
    });
});

// Forget Password Route

router.get("/forget-password", (req, res, next) => {
    res.render("./users/forgetpassword.ejs")
});

router.post('/forget/password', async (req, res) => {
    const { otp,newPassword, confirmNewPassword,email } = req.body;
    // Validate new passwords match
    let candidate = await Otp.findOne({ email });
    if(newPassword==confirmNewPassword&&otp==candidate.otp){
    try {
        const student = await User.findOne({email});
        // Update to new password
        await student.setPassword(newPassword);
        await student.save();
        req.flash('success_msg', 'Password Reset Successfully');
        req.flash('error_msg', 'Password Reset Successfully');
        res.render('./users/login.ejs');
    } catch (error) {
        console.error("Error updating password:", error);
        req.flash('error_msg', 'Some error occured');
        res.render('./users/login.ejs');
    }}
});

//User Info
router.get('/info',ensureAuthenticated, (req, res) => {
    res.render("./users/userDetails.ejs");
  });


module.exports = router;



