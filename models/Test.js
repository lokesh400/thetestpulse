const mongoose = require('mongoose');
// Question Schema
const QuestionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // It can be a number for numerical or string for MCQs (index)
    required: true
  },
  questionType: {
    type: String,
    required: true
  }
   // Store the index (0-3) of the correct option
});

// Test Schema
const TestSchema = new mongoose.Schema({
  title: String,
  questions: [QuestionSchema],
  time:Number,
  type:String,
  testMode:String
});

const Test = mongoose.model('Test', TestSchema);

module.exports = Test;