const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const cloudinary = require('cloudinary').v2;
const { isLoggedIn, isAllowed,isAdmin } = require('../middlewares/login');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

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
      return {
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret
      };
  }
};

// ✅ Cloudinary Upload Wrapper
const Upload = {
  uploadFile: async (filePath, subject, TopicName) => {
    console.log(filePath)
    try {
      const config = getCloudinaryConfig(subject);
      cloudinary.config(config);
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
        folder: TopicName?.toLowerCase() || 'default'
      });
      return result;
    } catch (error) {
      console.log(error)
    }
  }
};

// ✅ BULK UPLOAD ROUTE
router.post('/create-ques', isLoggedIn, isAllowed, upload.array("files", 10), async (req, res) => {
  try {
    const { subject, ChapterName, TopicName, questionType } = req.body;
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }
    const questions = [];
    for (let file of files) {
      const fileName = path.parse(file.originalname).name;
      const correctOptionFromFile = fileName.split('-')[1];

      if (!correctOptionFromFile) {
        console.warn(`Skipping file ${file.originalname} - invalid name format`);
        continue;
      }
      const correctAnswer = questionType === 'numerical'
        ? correctOptionFromFile
        : parseInt(correctOptionFromFile) - 1;
      const cloudResult = await Upload.uploadFile(file.path, subject, TopicName);
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting local file:', err);
      });
      questions.push({
        addedBy: req.user.id,
        SubjectName: subject,
        ChapterName,
        TopicName,
        Question: cloudResult.secure_url,
        Option1: 'Option 1',
        Option2: 'Option 2',
        Option3: 'Option 3',
        Option4: 'Option 4',
        CorrectOption: correctAnswer,
        questionType
      });
    }
    if (questions.length === 0) {
      return res.status(400).json({ message: 'No valid questions found to upload.' });
    }
    await Question.insertMany(questions);
    console.log('Bulk Upload Successful:', questions);
    res.status(200).json({ message: `${questions.length} questions uploaded successfully!` });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    res.status(500).json({ message: 'Bulk upload failed: ' + error.message });
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
    console.log(error);
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



//////////////////////////////////////
//route to delete a question//////////
//////////////////////////////////////

const extractPublicId = (url) => {
  if (!url || !url.includes("/upload/")) return null;

  return decodeURIComponent(
    url
      .split("/upload/")[1]
      .split(".")[0]
      .replace(/^v\d+\//, "")
  );
};

router.get("/admin/questionbank/delete/:id", async (req, res) => {
  try {
    const ques = await Question.findById(req.params.id);

    if (!ques) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Ensure this is a Cloudinary image
    const imageUrl = ques.Question;
    const publicId = extractPublicId(imageUrl);

    if (!publicId) {
      return res.status(400).json({
        message: "Invalid or missing Cloudinary image URL",
      });
    }

    console.log("Deleting Cloudinary public_id:", publicId);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    // Delete DB record only if Cloudinary deletion succeeded OR image already gone
    if (result.result === "ok" || result.result === "not found") {
      await Question.findByIdAndDelete(req.params.id);
    }

    res.status(200).json({
      message: "Question deleted successfully",
      cloudinary: result,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
