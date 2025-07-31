const express = require("express");
const router =  express.Router();
const User = require('../models/User');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Batch = require('../models/Batch');
// const StudentTest = require('../models/StudentTest');

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }


  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

  router.get("/admin", ensureAuthenticated, isAdmin, async (req, res) => {
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
router.delete('/admin/delete/test/:id', async (req, res) => {
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
router.get('/admin/tests', async (req, res) => {
    const tests = await Test.find({}); // Fetch all tests from the database
    res.render('./testseries/admin-test', { tests });
  });
  
router.get('/admin/test/:id', async (req, res) => {
    const test = await Test.findById(req.params.id);
    res.render('./admin/print-test.ejs', { test });
  });


module.exports = router;
