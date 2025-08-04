const express = require("express");
const router = express.Router();
const User = require('../models/User');
const userTeacher = require('../models/userTeacher');
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

router.get("/login", (req, res) => {
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
    const user1 = await userTeacher.findOne({ username:email });
    let candidate = await Otp.findOne({ email: user1.email });
    if(newPassword==confirmNewPassword&&otp==candidate.otp){
    try {
        const student = await userTeacher.findOne({username:email});
        await student.setPassword(newPassword);
        await student.save();
        req.flash('success_msg', 'Password updated successfully. You can now login with your new password.');
        // Send confirmation email
        res.redirect('/user/login');
    } catch (error) {
        console.error("Error updating password:", error);
        req.flash('error_msg', 'Some error occured');
        res.redirect('/user/login');
    }} else{
        req.flash('error_msg', 'OTP or Password do not match');
        res.redirect('/user/forget-password');
    }
});

//User Info
router.get('/info',ensureAuthenticated, (req, res) => {
    res.render("./users/userDetails.ejs");
  });


module.exports = router;



