var mongoose = require('mongoose');

var synonymSchema = new mongoose.Schema({
  tag: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  keyWord: {
    type : String ,
    required: true,
  }, 
  synonyms: {
    type: Array,
    required: true,
  }, 
});

var synonyms = mongoose.model('synonymsSchema', synonymSchema);

module.exports = synonyms;