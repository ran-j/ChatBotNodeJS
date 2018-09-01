var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

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

var synonyms = mongoose.model('synonymsSchema', synonymSchema);

module.exports = synonyms;