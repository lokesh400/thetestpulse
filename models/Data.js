const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    text: Array,
    date:Number,
    month:String,
    year:Number
});

const DataModel = mongoose.model('Data', dataSchema);

module.exports = DataModel;