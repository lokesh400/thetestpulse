const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
    SubjectName : String,
    ChapterName : String,
    TopicName: String

});

const Topic = mongoose.model('Topic', TopicSchema);

module.exports = Topic;