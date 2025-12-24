const express = require("express");
const router =  express.Router();
const Test = require('../models/Test');
const Batch = require('../models/Batch');
const Complaint = require('../models/Complaints');
const User = require('../models/User');

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { error } = require("console");

cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

// Function to upload files to Cloudinary
const Upload = {
  uploadFile: async (filePath) => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
      });
      return result;
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
};

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

const checkPurchasedBatch = (req, res, next) => {
    const { id } = req.params;
    if ( req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).send('Access denied: You have not purchased this batch.');
    }
};

router.get('/showallbatches',ensureAuthenticated, async (req, res) => {
    const allBatches = await Batch.find(); // Fetch available batches from database
    res.render('./batch/showallbatches.ejs', { allBatches });
  });    

  //ADMIN ROUTE TO CREATE NEW BATCH
router.get('/admin/createnewbatch', ensureAuthenticated,isAdmin,async (req, res) => {
      res.render('./batch/createbatchindex.ejs');
  });

// Post request of above route
router.post('/admin/create/batch',ensureAuthenticated,isAdmin, upload.single("file"), async (req, res) => {
    try {
     const {name,grade,tag,description,amount} = req.body;
     const result = await Upload.uploadFile(req.file.path);
     const imageUrl = result.secure_url
     fs.unlink(req.file.path, (err) => {
       if (err) {
         console.error('Error deleting local file:', err);
       } else {
         console.log('Local file deleted successfully');
       }
     });
     const newBatch = new Batch({ 
       title:name,
       thumbnail : imageUrl,
       class:grade,
       tests:[],
       announcements:[],
       tag:tag,
       description:description,
       amount:amount
     });
     await newBatch.save();
   } catch (error) {
     console.error(error);
     res.status(500).send('Upload failed.');
   }
  });  

  //Route to show all free batches
router.get('/showfreebatches',ensureAuthenticated, async (req, res) => {
    const allBatches = await Batch.find({amount:"0"}); // Fetch available batches from database
    res.render('./batch/freebatch.ejs', { allBatches });
  });    
   
// show a particular requested batch
router.get('/showbatch/:id', ensureAuthenticated, checkPurchasedBatch, async (req, res) => {
  const { id } = req.params;
  try {
      const thisBatch = await Batch.findById(id);
      if (!thisBatch) {
          return res.status(404).send('Batch not found');
      }
      res.render('./batch/particularbatchhome.ejs', { thisBatch });
  } catch (error) {
      // console.error(error);
      return res.status(500).send('Server error');
  }
});

// Route to include tests in a batch
router.get('/update-batch/:id',ensureAuthenticated, async (req, res) => {
    const {id} = req.params;
    const tests = await Test.find();
    res.render('./batch/updateBatch.ejs',{ tests,id });
  });

//Post route to include a test in batch
router.post('/create/:testId/:batchId',ensureAuthenticated,isAdmin, async (req, res) => {
    try {
      let { testId, batchId } = req.params; // Extracting id and name from params
      const newte = await Batch.findById(batchId); // Find the batch by title
      const test = await Test.findById(testId);
      const name = test.title;
      const details = {
         title:name,
         id:testId
      };
      if (!newte) {
        return res.status(404).json({ message: 'Batch not found' }); // Handle case where batch is not found
      }
      newte.tests.push(details); 
      await newte.save();
      res.redirect(`/showbatch/${batchId}`);
    }
      catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

//ROUTE TO FETCH ANNOUNCEMENTS
router.get('/batch/:id/announcements',ensureAuthenticated, async (req, res) => {
  try {
      const id = req.params.id; // Access the ID directly
      console.log("Batch id is", id);
      const batch = await Batch.findById(id);

      if (!batch) {
          return res.status(404).send('Batch not found');
      }
      res.json(batch.announcements);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

// ROUTE TO ADD ANNOUNCEMENTS
router.post('/create/new/announcement/:testId', ensureAuthenticated,async (req, res) => {
  try {
    const { testId } = req.params; // Extracting testId from params
    const {text} = req.body; // Extract the announcement data from the request body
    // Find the batch by testId
    const batch = await Batch.findById(testId); 
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' }); // Handle case where batch is not found
    }
    // Push the new announcement into the announcements array
    batch.announcements.push(text); 
    await batch.save(); // Save the updated batch
    res.redirect('/showallbatches'); // Redirect after successful creation
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message }); // Return error response
  }
});


// ROUTE TO Submit a complaint
router.get("/complaint/batch/:batchName/:id",async(req,res)=>{
  const {batchName,id} = req.params;
  res.render("./complaints/student-window.ejs",{batchName,id});
})

router.post("/user/complaint/:batchName/:id",async (req,res)=>{
  const {batchName,id} = req.params;
  const {complaint} = req.body;
  const student = req.user;

  const newComplaint = new Complaint({
    batch:batchName,
    issue:complaint,
    student:student,
  })
  await newComplaint.save();
  res.redirect(`/showbatch/${id}`)

})

// route to send all complaints to admin
router.get("/admin/allcomplaints",async (req,res)=>{
  const allComplaints = await Complaint.find({});
  res.render("./admin/complaints.ejs",{allComplaints})
})

//Route to show purchased batch 
router.get('/show/purchasedbatches',ensureAuthenticated, async (req, res) => {
  try{
    var batches = [];
  for (let i = 0; i < req.user.purchasedBatches.length; i++) {
    const batch = await Batch.findById(req.user.purchasedBatches[i]);
    if (batch) {
        batches.push(batch); // Push the found batch into the array
    }
  }
   res.render('./batch/purchasedbatches.ejs',{batches});
  }catch(error){
    res.send(error.message)
  }
  
 });

// Routes to add a batch manually if payment fails
router.get('/batch/:batchId/authorize-students', async (req, res) => {
  try {
      const { batchId } = req.params; // Destructure batchId from req.params
      const students = await User.find(); // Fetch all students
      res.render('authorize-students', { students, batchId }); // Render the EJS template with the students and batchId
  } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).send('Server Error');
  }
});
// Post Route to authorize a student
router.post('/batch/:batchId/authorize/:studentEmail', async (req, res) => {
  const { batchId,studentEmail } = req.params;
  const userString = JSON.stringify(studentEmail, null, 2);
  const emailMatch = userString.match(/email:\s*'([^']+)'/);
  const email = emailMatch ? emailMatch[1] : null; // Pretty print the user object
  try {
      // Fetch current user document
      const user = await User.find({ email: email });
      // Add batch ID to purchasedBatches
      await User.updateOne(
          { email: email },
          { $addToSet: { purchasedBatches: batchId } }
      );
      req.flash('success_msg', 'Batch authorized successfully!');
      res.redirect(`/batch/${batchId}/authorize-students`);
  } catch (error) {
      console.error('Error authorizing student:', error);
      req.flash('error_msg', 'An error occurred while authorizing the batch.');
      res.status(500).send('Server Error');
  }
});

//Post route to authorise a student in free batch
router.post('/free/:batchId', async (req, res) => {
  const { batchId } = req.params;
  const email = req.user.email; // Pretty print the user object
  try {
      // Fetch current user document
      const user = await User.find({ email: email });
      // Add batch ID to purchasedBatches
      await User.updateOne(
          { email: email },
          { $addToSet: { purchasedBatches: batchId } }
      );
      req.flash('success_msg', 'Batch authorized successfully!');
      res.redirect(`/showbatch/${batchId}`);
  } catch (error) {
      console.error('Error authorizing student:', error);
      req.flash('error_msg', 'An error occurred while authorizing the batch.');
      res.status(500).send('Server Error');
  }
});

module.exports = router;
