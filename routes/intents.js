var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('login');  
});

router.get('/intents', async (req, res, next) => {  
  require('../models/intents').find({},function(err,inte){
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    res.render('Training/intents', { intents, focus: 1 });  
  }); 
});

router.get('/synonyms', async (req, res, next) => {  
  require('../models/synonyms').find({},function(err,synonym){
    var synonyms =  synonym.length > 0 ? synonym : require('../Libs/synonyms');
    res.render('Training/synonyms', { synonyms, focus: 2 });  
  }); 
});

router.get('/edit/:tag', async (req, res, next) => {  
  require('../models/intents').find({},function(err,inte){
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    intents.forEach(function(intent){
      if(intent.tag == req.params.tag){
        res.render('Training/edit_intents', { intent, focus: 1 });
      }
    });
  });    
});

router.get('/training/:tag', async (req, res, next) => {  
  require('../models/intents').find({},function(err,inte){
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    intents.forEach(function(intent){
      if(intent.tag == req.params.tag){
        res.render('Training/training', { intent, focus: 1 });
      }
    });
  });    
});

router.get('/editkey/:keyword', async (req, res, next) => {  
  require('../models/synonyms').find({},function(err,syn){
    var synonyms =  syn.length > 0 ?  syn : require('../Libs/synonyms');
    synonyms.forEach(function(synonym){
      if(synonym.keyWord == req.params.keyword){
        res.render('Training/synonymsEdit', { synonym, focus: 2 });
      }
    });
  });    
});

module.exports = router;
