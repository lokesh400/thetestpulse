const express = require("express");
const router =  express.Router();
const User = require('../models/User');
const userTeacher = require('../models/userTeacher');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Batch = require('../models/Batch');
const nodemailer = require("nodemailer")
const {isAdmin,isAllowed,isLoggedIn} = require('../middlewares/login')


  router.get("/admin", isLoggedIn, isAllowed, async (req, res) => {
    try {
      const Users = await User.find();
      const Members = await User.find({ role: "admin" });
      const Questions = await Question.find();
      const Tests = await Test.find();
      let totalPurchasedBatches = 0;
      for (let i = 0; i < Users.length; i++) {
        totalPurchasedBatches += Users[i].purchasedBatches.length;
      }
      const details = {
        users: Users.length,               
        questions: Questions.length,      
        tests: Tests.length,               
        members: Members,                  
        totalPurchasedBatches: totalPurchasedBatches,
      };
      res.render("./admin/admin-index.ejs", { details });
    } catch (err) {
      console.error("Error fetching data:", err);
      res.status(500).send("Server Error");
    }
  });
 
// ADMIN ROUTE TO DELETE A TEST  
router.delete('/admin/delete/test/:id',isLoggedIn,isAllowed, async (req, res) => {
  const testId = req.params.id; // Get the test ID from the request parameters
  try {
    const result = await Test.findByIdAndDelete(testId);
        if (!result) {
            return res.status(404).json({ error: 'Test not found.' });
        }
      // Find all batches containing the test with the matching ID and remove that test from the tests array
      const updateResult = await Batch.updateMany(
          { "tests.id": testId }, // Find batches containing a test with the matching testId
          { $pull: { tests: { id: testId } } } // Remove the test with the matching ID from the tests array
      );
      if (updateResult.modifiedCount > 0) {
          return res.status(200).json({ message: 'Test deleted successfully from all batches!' });
      } else {
          return res.status(200).json({ message: 'Test deleted successfully, but no batches contained this test.' });
      }
  } catch (error) {
      console.log('Error deleting test:', error);
      return res.status(500).json({ error: error.message });
  }
});

  // Admin Route - List all tests
router.get('/admin/tests',isLoggedIn,isAllowed, async (req, res) => {
    const tests = await Test.find({}); // Fetch all tests from the database
    res.render('./testseries/admin-test', { tests });
  });
  
router.get('/admin/test/:id',isLoggedIn,isAllowed, async (req, res) => {
    const test = await Test.findById(req.params.id);
    res.render('./admin/print-test.ejs', { test });
  });

  // route to show all the users
  /////////////////////////////

  router.get('/admin/users',isLoggedIn,isAdmin, async (req, res) => {
  try {
    const users = await userTeacher.find();
    res.render('admin/allUsers.ejs', { users });
  } catch (err) {
    res.status(500).send('Error fetching users');
  }
});

////////////admin route to add user////////
//////////////////////////////////////////

router.get('/admin/add/new/teacher',isLoggedIn,isAdmin, (req, res) => {
  res.render('admin/addTeacher');
});

// POST route to add teacher
router.post('/admin/add/new/teacher',isLoggedIn,isAdmin, async (req, res) => {
  const { name, contactNumber, email, username } = req.body;

  function generatePassword(length = 8) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomChar = charset.charAt(Math.floor(Math.random() * charset.length));
    password += randomChar;
  }
  return password;
}

const password = generatePassword(); // Generate a random password

  try {
    // Check if username or email already exists
    const existingUser = await userTeacher.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username or Email already exists");
    }

    // Register new teacher
    const newUser = new userTeacher({
      name,
      contactNumber,
      email,
      username,
      role:'teacher'
    });

    await userTeacher.register(newUser, password);

    // Setup nodemailer
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

    // Send credentials email
    const mailOptions = {
      from: '"The Test Pulse" <lokeshbadgujjar401@gmail.com>',
      to: email,
      subject: 'Your The Test Pulse Credentials',
      text: `Dear ${name},\n\nHere are your credentials for The Test Pulse:\nUsername: ${username}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nRegards,\nThe Test Pulse Team`
    };

    await transporter.sendMail(mailOptions);
    req.flash('success_msg', 'Teacher user created successfully and credentials sent via email.')
    res.redirect('/admin/add/new/teacher');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating teacher user');
  }
});

////route to show all questions by a user///////////////////
router.get("/questions/by-user/:username",isLoggedIn,isAllowed, async (req, res) => {
  const { username } = req.params;

  try {
    const user = await userTeacher.findById(username);
    const namee = user.name;
    const questions = await Question.find({ addedBy: username }).select("_id SubjectName");
    const total = questions.length;

    res.render("quesByUser", {
      namee,
      total,
      questions
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching questions");
  }
});



module.exports = router;
