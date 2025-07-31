const mongoose = require('mongoose');

const QuesOfDaySchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Batch' },
  SubjectName: String,
  Question: String,
  correctAnswer:String,
  postedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuesOfDay', QuesOfDaySchema);