const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  batchId:String,
  zenodoLink: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);
