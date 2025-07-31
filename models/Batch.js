const mongoose = require('mongoose');

const BatchTest = new mongoose.Schema({
     title:String,
     id:String
});

const BatchSchema = new mongoose.Schema({
     title:String,
     thumbnail:String,
     class:String,
     amount:Number,
     tests:[BatchTest],
     tag:String,
     description:String,
     announcements:Array,
});

const Batch = mongoose.model('Batch', BatchSchema);

module.exports = Batch;