const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
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
  },
  testScore:{
    type:Number,
  },
  purchasedBatches:Array,
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;