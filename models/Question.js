const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    SubjectName : String,
    ChapterName : String,
    TopicName: String,
    Question : String,
    Option1 : String,
    Option2 : String,
    Option3 : String,
    Option4: String,
    CorrectOption: {
        type: mongoose.Schema.Types.Mixed, // It can be a number for numerical or string for MCQs (index)
        required: true
      },
    questionType: {
        type: String,
        enum: ['mcq', 'numerical'],
        required: true
      }
});

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;