const express = require("express");
const router =  express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');


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

// router.get('/admin/create',ensureAuthenticated,isAdmin,(req, res) => {
//   try{
//     res.render('./testseries/createtest.ejs');
//    }catch(error){
//     res.send(error)
//    }
// });

router.get('/create', ensureAuthenticated,isAdmin, async (req, res) => {
    try{
      res.render('./testseries/TestFromQuestionBank.ejs');
     }catch(error){
      res.send(error)
     }
  });
  
router.get('/api/subjects',ensureAuthenticated,isAdmin, async (req,res) => {
    try{
      const subjects = await Subject.find({})
      res.json(subjects);
     }catch(error){
      res.send(error)
     }
  })
  
router.get('/api/chapters/:name',ensureAuthenticated,isAdmin, async (req,res) => {
    try{
      const {name} = req.params;
    const chapter = await Chapter.find({SubjectName : name})
    res.json(chapter);
     }catch(error){
      res.send(error)
     }
  })
  
router.get('/api/topics/:name',ensureAuthenticated,isAdmin, async (req,res) => {
    try{
      const {name} = req.params;
      const chapter = await Topic.find({ChapterName : name})
      res.json(chapter);
     }catch(error){
      res.send(error)
     }
  })
  
router.get('/api/questions/:name',ensureAuthenticated,isAdmin, async (req,res) => {
    try{
      const {name} = req.params;
      const chapter = await Question.find({TopicName : name})
      res.json(chapter);
     }catch(error){
      res.send(error)
     }
  })
  
  
router.post('/secondlastfinalsubmit', async (req, res) => {
   try{
    const selectedOptions = req.body.options; // options will be an array
    let data =[];
    for(let i=0;i<selectedOptions.length;i++){
       let ques = await Question.findById(selectedOptions[i]); 
       let data2 = data.push(ques)
    }
     res.render('./testseries/TestFromQuestionBank2.ejs',{data});
   }catch(error){
    res.send(error)
   }
});

// Handle form submission for creating a test
router.post('/final', async (req, res) => {
  try{
    const { title, questions,time, type2,testMode } = req.body;
  const type = type2.toUpperCase();
  const formattedQuestions = questions.map(q => ({
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    questionType: q.questionType,
  }));

  const newTest = new Test({ title, questions: formattedQuestions ,time, type,testMode});
  await newTest.save();
  const tests = await Test.find({});
  res.render('./testseries/admin-test', { tests });
  }catch(error){
    res.send(error)
  }
});

//Test Portal Home Page
router.get('/testportal', ensureAuthenticated,isAdmin,(req, res) => {
  res.render('./testseries/indexx.ejs');
});
  
module.exports = router;
