const express = require("express");
require('dotenv').config();
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");

const cors = require("cors");
app.use(cors());
app.use(cors({
  origin: true,
  credentials: true,
}));

const Test = require('./models/Test');
const User = require('./models/User');
const Batch = require('./models/Batch');
const Question = require('./models/Question');
const userTeacher = require('./models/userTeacher');

const userrouter = require("./routes/user.js");
const testrouter = require("./routes/testseries.js");
const questionbankrouter = require("./routes/questionbank.js");
const batchrouter = require("./routes/batch.js");
const otprouter = require("./routes/otp.js");
// const studenttestrouter = require("./routes/studenttest.js");
const adminrouter = require("./routes/admin.js");
const testpdfrouter = require("./routes/testpdf.js");


const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { error } = require("console");

// Configure Cloudinary
cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret,
});

// Connect to MongoDB
mongoose.connect(process.env.mongo_url)
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => console.log('Error connecting to MongoDB: ', err));;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());

const store = MongoStore.create({
  mongoUrl:process.env.mongo_url,
  crypto:{
    secret: process.env.secret,
  },
  touchAfter: 24*3600
})

store.on("error", ()=>{
  console.log("error in connecting mongo session store",error)
})

const sessionOptions = {
  store,
  secret: process.env.secret,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires: Date.now() + 3*24*60*60*1000,
    maxAge: 3*24*60*60*1000,
    httpOnly: true,
  }
}

const Upload = {
  uploadFile: async (filePath) => {
    try {
      const result = await cloudinary.uploader.upload(filePath);
      return result; // Return the upload result
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  },
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(userTeacher.authenticate()));
passport.serializeUser(userTeacher.serializeUser());
passport.deserializeUser(userTeacher.deserializeUser());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.currUser = req.user;
    next();
});

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

const resourcerouter = require("./routes/resource.js");

// app.use("/blogs",blogsrouter);
app.use("/user",userrouter);
app.use("/user",otprouter);
app.use("/test",testrouter);
app.use("/",questionbankrouter);
app.use("/",batchrouter);
app.use("/",adminrouter);


// Catch-all 404 middleware (must be at the very end)
app.use((req, res, next) => {
  res.status(404).render('error/404');
});


// const newUser = async () => {

//     const name = "Lokesh Badgujjar";
//     const contactNumber = "9315796489";
//     const email = "lokeshbadgujjar400@gmail.com";
//     const username = "lokesh.1@thetestpulse.com";
//     const password = "12345678";
  
//       // Register new teacher
//       const newUser = new userTeacher({
//         name,
//         contactNumber,
//         email,
//         username,
//         role:'admin'
//       });
//       await userTeacher.register(newUser, password);
//       console.log("User created successfully");

// };

// newUser();

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
