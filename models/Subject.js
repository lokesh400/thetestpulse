const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    Name : String
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;