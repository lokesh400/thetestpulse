// const express = require("express");
// const mongoose = require("mongoose");
// const router = express.Router();
// const Subject = require('../models/Subject');
// const Chapter = require('../models/Chapter');
// const Topic = require('../models/Topic');
// const Question = require('../models/Question');
// const Test = require('../models/Test');

// const multer = require('multer');
// const path = require('path');
// const cloudinary = require('cloudinary').v2;
// const fs = require('fs');
// const { error } = require("console");

// const physics = cloudinary.config({
//     cloud_name:process.env.physics_cloud_name, 
//     api_key:process.env.physics_api_key, 
//     api_secret:process.env.physics_api_secret
// });

// const chemistry = cloudinary.config({
//     cloud_name:process.env.chemistry_cloud_name, 
//     api_key:process.env.chemistry_api_key, 
//     api_secret:process.env.chemistry_api_secret
// });

// const mathematics = cloudinary.config({
//     cloud_name:process.env.mathematics_cloud_name, 
//     api_key:process.env.mathematics_api_key, 
//     api_secret:process.env.mathematics_api_secret
// });

// const biology = cloudinary.config({
//     cloud_name:process.env.biology_cloud_name, 
//     api_key:process.env.biology_api_key, 
//     api_secret:process.env.biology_api_secret
// });

// // Multer disk storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Save files to 'uploads/' folder
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     // Use the original file name
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// // Initialize multer with diskStorage
// const upload = multer({ storage: storage });

// // Function to upload files to Cloudinary
// const Upload = {
//   uploadFile: async (filePath) => {
//     try {
//       // Upload the file to Cloudinary
//       const result = await cloudinary.uploader.upload(filePath, {
//         resource_type: "auto", // Auto-detect file type (image, video, etc.)
//       });
//       return result;
//     } catch (error) {
//       throw new Error('Upload failed: ' + error.message);
//     }
//   }
// };



const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');

const {isAdmin,isAllowed, isLoggedIn} = require('../middlewares/login')

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storage });

// ✅ Dynamic Cloudinary Config based on Subject
const getCloudinaryConfig = (subject) => {
  switch (subject?.toLowerCase()) {
    case 'physics':
      return {
        cloud_name: process.env.physics_cloud_name,
        api_key: process.env.physics_api_key,
        api_secret: process.env.physics_api_secret
      };
    case 'chemistry':
      return {
        cloud_name: process.env.chemistry_cloud_name,
        api_key: process.env.chemistry_api_key,
        api_secret: process.env.chemistry_api_secret
      };
    case 'mathematics':
      return {
        cloud_name: process.env.mathematics_cloud_name,
        api_key: process.env.mathematics_api_key,
        api_secret: process.env.mathematics_api_secret
      };
    case 'biology':
      return {
        cloud_name: process.env.biology_cloud_name,
        api_key: process.env.biology_api_key,
        api_secret: process.env.biology_api_secret
      };
    default:
      // ✅ Default cloudinary config fallback
      return {
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret
      };
  }
};

// ✅ File Upload Logic using dynamic Cloudinary config
const Upload = {
  uploadFile: async (filePath, TopicName) => {
    try {
      const config = getCloudinaryConfig(TopicName);
      cloudinary.config(config);

      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
        folder: TopicName?.toLowerCase() || 'default'  // Upload to folder by subject
      });

      return result;
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
};

// ✅ Create Question Route
router.post('/create-ques',isLoggedIn,isAllowed, upload.single("file"), async (req, res) => {
  try {
    const { SubjectName, ChapterName, TopicName, CorrectOption, questionType } = req.body;

    // Upload file to Cloudinary under appropriate config
    const result = await Upload.uploadFile(req.file.path,TopicName);
    const imageUrl = result.secure_url;

    // Delete local uploaded file after cloud upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting local file:', err);
      else console.log('Local file deleted');
    });

    // Adjust correct answer based on type
    const answer = questionType === 'numerical' ? CorrectOption : CorrectOption - 1;

    // Save to database
    const newQuestion = new Question({
      addedBy:req.user.id,
      SubjectName,
      ChapterName,
      TopicName,
      Question: imageUrl,
      Option1: "Option 1",
      Option2: "Option 2",
      Option3: "Option 3",
      Option4: "Option 4",
      CorrectOption: answer,
      questionType
    });

    await newQuestion.save();

    res.status(200).json({ message: 'Question created successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});

router.get('/create/question/bank',isLoggedIn,isAllowed, async(req,res) =>{
    res.render('./questionbank/createques.ejs')
  })

  router.get('/create',isLoggedIn,isAllowed,async (req, res) => {
    res.render('./testseries/TestFromQuestionBank.ejs');
  });
  
router.get('/api/subjects',isLoggedIn,isAllowed, async (req,res) => {
    const subjects = await Subject.find({})
    res.json(subjects);
  })
  
router.get('/api/chapters/:name',isLoggedIn,isAllowed, async (req,res) => {
    const {name} = req.params;
    const chapter = await Chapter.find({SubjectName : name})
    res.json(chapter);
  })
  
router.get('/api/topics/:name',isLoggedIn,isAllowed, async (req,res) => {
    const {name} = req.params;
    const chapter = await Topic.find({ChapterName : name})
    res.json(chapter);
  })
  
router.get('/api/questions/:name',isLoggedIn,isAllowed, async (req,res) => {
    const {name} = req.params;
    const chapter = await Question.find({TopicName : name})
    res.json(chapter);
  })  
  
  router.post('/create-ques',isLoggedIn,isAllowed, upload.single("file"), async (req, res) => {
    try {
      const { subject, chapter, topic, correct,questionType } = req.body;
      const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
      const imageUrl = result.secure_url;
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
        } else {
          console.log('Local file deleted successfully');
        }
      });
      var answer;
      if(questionType=='numerical'){
        answer = correct;
      } else {
        answer = correct-1;
      }
      const newQuestion = new Question({
        SubjectName: subject,
        ChapterName: chapter,
        TopicName: topic,
        Question: imageUrl,
        Option1: "Option 1",
        Option2: "Option 2",
        Option3: "Option 3",
        Option4: "Option 4",
        CorrectOption: answer,
        questionType:questionType
      });
  
      await newQuestion.save();
      res.status(200).json({ message: 'Question created successfully!' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  });
  
router.get('/create/information',isLoggedIn,isAdmin, async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.render('./questionbank/createinfo', { subjects, success: req.flash('success'), error: req.flash('error') });
  } catch (error) {
    req.flash('error', 'Error loading details.');
    res.redirect('/');
  }
});

// Add Subject
router.post('/create/subject',isLoggedIn,isAdmin, async (req, res) => {
  try {
    const { subject } = req.body;
    await new Subject({ Name: subject }).save();
    req.flash('success', 'Subject added!');
    res.redirect('/create/information');
  } catch (error) {
    req.flash('error', 'Failed to add subject.');
    res.redirect('/create/information');
  }
});

// Add Chapter
router.post('/create/chapter', isLoggedIn,isAdmin, async (req, res) => {
  try {
    const { subject, chapter } = req.body;
    await new Chapter({ SubjectName: subject, ChapterName: chapter }).save();
    req.flash('success', 'Chapter added!');
    res.redirect('/create/information');
  } catch (error) {
    req.flash('error', 'Failed to add chapter.');
    res.redirect('/create/information');
  }
});

// Add Topic
router.post('/create/topic',isLoggedIn,isAdmin, async (req, res) => {
  try {
    const { subject, chapter, topic } = req.body;
    await new Topic({ SubjectName: subject, ChapterName: chapter, TopicName: topic }).save();
    req.flash('success', 'Topic added!');
    res.redirect('/create/information');
  } catch (error) {
    req.flash('error', 'Failed to add topic.');
    res.redirect('/create/information');
  }
});
  
// Admin route to update a question's answer
router.get('/admin/questionbank/update',isLoggedIn,isAllowed, async(req,res) => {
  try{
   res.render('./questionbank/edit-question.ejs');
 }catch(error){
   res.send(error)
 }
})

router.post('/admin/questionbank/update/:id',isLoggedIn,isAllowed, async(req,res) => {
  try{
   const correctOption = req.body.correctOption; 
   const {id} = req.params; 
   const updatedQuestion = await Question.findByIdAndUpdate(
    id,
    { CorrectOption: correctOption-1 },
    { new: true, runValidators: true }
);
 }catch(error){
   res.send(error)
 }
})


module.exports = router;
