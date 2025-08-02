const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const userTeacherSchema = new mongoose.Schema({
  name:{
    type:String,
  },
  contactNumber:{
    type:Number,
  },
  role:{
    type:String
  },
  email:{
    type:String,
    required:true,
  },
  username:{
    type:String,
    required:true,
  }
});

userTeacherSchema.plugin(passportLocalMongoose);

const userTeacher = mongoose.model('userTeacher', userTeacherSchema);

module.exports = userTeacher;