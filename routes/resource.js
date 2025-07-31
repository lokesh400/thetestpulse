const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const Resource = require('../models/Resource');
require('dotenv').config();

const Batch = require('../models/Batch');

const upload = multer({ dest: 'uploads/' });

const {
    isLoggedIn,
    saveRedirectUrl,
    isAdmin,
  } = require("../middlewares/login.js");

// Middleware to check Zenodo token
const checkZenodoToken = (req, res, next) => {
  if (!process.env.ZENODO_TOKEN) {
    return res.status(500).render('error', { 
      message: 'Zenodo token is not configured' 
    });
  }
  next();
};


router.get('/upload/this/:id', saveRedirectUrl,isLoggedIn,isAdmin, async (req,res)=>{
  res.render('resource/upload.ejs',{id:req.params.id})
})

router.post('/add-department', saveRedirectUrl,isLoggedIn,isAdmin, async (req, res) => {
  try {
    const { name } = req.body; // Get yearId and department name from the form
    const newDepartment = new Department({ name });
    await newDepartment.save();
    res.redirect('/add/details'); // Redirect after adding the department
  } catch (error) {
    console.error('Error adding department:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add-branch', saveRedirectUrl,isLoggedIn,isAdmin,async (req, res) => {
  try {
    const { year,department,name } = req.body;
    const newBranch = new Branch({ name:name,year:year,department:department });
    await newBranch.save();
    res.redirect('/add/details');
  } catch (error) {
    console.error('Error adding branch:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add-subject',saveRedirectUrl,isLoggedIn,isAdmin, async (req, res) => {
    try {
        const { year, department, branch, name, } = req.body;
        const newSubject = new Subject({
            year,
            department,
            branch,
            name,
        });
        await newSubject.save();
        res.redirect('/add/details');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding subject');
    }
});

router.get('/upload', async (req, res) => {
  try {
    // Fetch all the years from the database
    const years = await Year.find();
    // Render the page with the fetched years
    res.render('resource/upload', { years });
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/departments/:yearId', async (req, res) => {
  const departments = await Department.find();
  res.json(departments);
});

router.get('/branches/:yearId/:deptId', async (req, res) => {
  const branches = await Branch.find({ department: req.params.deptId });
  res.json(branches);
});

router.get('/subjects/:yearId/:deptId/:branchId', async (req, res) => {
  const subjects = await Subject.find({
    year: req.params.yearId,
    department: req.params.deptId,
    branch: req.params.branchId
  });
  res.json(subjects);
});

// router.post('/view-docs', (req, res) => {
//   const { year, department, branch, subject } = req.body;
//   res.redirect(`/view/docs/${year}/${department}/${branch}/${subject}`);
// });


// select year
router.get('/view/docs', async (req, res) => {
  try {
    const years = await Department.find();
    res.render('resource/select.ejs', { years });
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).render('error', { 
      message: 'Failed to load resources' 
    });
  }
});


//select branch
router.post('/view-docs', async (req, res) => {
  try {
     res.render('resource/selectBranch.ejs');
  } catch (err) {
    console.error('Error fetching resources:', err.message);
    res.status(500).render('error', { message: 'Failed to fetch documents' });
  }
});

router.post('/upload/to/this/batch/:id', checkZenodoToken, upload.single('pdf'), async (req, res) => {
  const { title } = req.body;
  
  if (!req.file) {
    return res.status(400).render('error', { 
      message: 'No file uploaded' 
    });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    // Step 1: Create deposition
    const createRes = await axios.post(
      'https://zenodo.org/api/deposit/depositions',
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    const depositionId = createRes.data.id;

    // Step 2: Upload file
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), fileName);

    const uploadRes = await axios.post(
      `https://zenodo.org/api/deposit/depositions/${depositionId}/files`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // Step 3: Add metadata
    await axios.put(
      `https://zenodo.org/api/deposit/depositions/${depositionId}`,
      {
        metadata: {
          title: title,
          upload_type: 'publication',
          publication_type: 'article',
          description: 'Uploaded via TheTestPulse',
          creators: [{ name: 'TheTestPulse User' }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // Step 4: Publish
    const publishRes = await axios.post(
      `https://zenodo.org/api/deposit/depositions/${depositionId}/actions/publish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // Step 5: Save to DB
    const resource = new Resource({
      title,
      batchId:req.params.id,
      zenodoLink: `https://zenodo.org/record/${publishRes.data.record_id}/files/${publishRes.data.files[0].filename}?download=1`, // Make sure `fileLink` is correctly assigned
    });

    await resource.save();
    fs.unlinkSync(filePath); // remove temp file
    res.redirect('/view/docs');
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    
    // Clean up uploaded file if error occurred
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).send(err);
  }
});


module.exports = router;