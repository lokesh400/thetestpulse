const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    batch:String,
    issue:String,
    student:Object,
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);

module.exports = Complaint;