const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
    SubjectName : String,
    ChapterName : String,

});

const Chapter = mongoose.model('Chapter', ChapterSchema);

module.exports = Chapter;