var mongoose = require('mongoose');

var synonymSchema = new mongoose.Schema({
  title: {
    type : String ,
    required: true,
  }, 
  keyWord: {
    type : String ,
    required: true,
    lowercase: true,
  }, 
  synonyms: {
    type: Array,
    required: true,
  }, 
});

var synonyms = mongoose.model('Synonym', synonymSchema);

module.exports = synonyms;