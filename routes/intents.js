var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.render('login');  
});

router.get('/home', (req, res, next) => {
  res.render('index',{ focus: 0 });  
});

router.get('/intents', async (req, res, next) => {  
  require('../models/intents').find({},(err,inte) =>{
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    res.render('Training/intents', { intents, focus: 1 });  
  }); 
});

router.get('/synonyms', async (req, res, next) => {  
  require('../models/synonyms').find({},(err,synonym) =>{
    var synonyms =  synonym.length > 0 ? synonym : require('../Libs/synonyms');
    res.render('Training/synonyms', { synonyms, focus: 2 });  
  }); 
});

router.get('/edit/:tag', async (req, res, next) => {  
  require('../models/intents').find({},(err,inte) =>{
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    let found = false;
    intents.forEach((intent) =>{
      if(intent.tag == req.params.tag){
        res.render('Training/edit_intents', { intent, focus: 1 });
      }
    });
    if(!found){res.render('404');}
  });    
});

router.get('/training/:tag', async (req, res, next) => {  
  require('../models/intents').find({},(err,inte) =>{
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    let found = false;
    intents.forEach((intent) =>{
      if(intent.tag == req.params.tag){
        found = true;
        res.render('Training/training', { intent, focus: 1 });
      }
    });
    if(!found){res.render('404');}
  });    
});

router.get('/editkey/:keyword', async (req, res, next) => {  
  require('../models/synonyms').find({},(err,syn) =>{
    var synonyms =  syn.length > 0 ?  syn : require('../Libs/synonyms');
    let found = false;
    synonyms.forEach((synonym) =>{
      if(synonym.keyWord == req.params.keyword){
        found = true;
        res.render('Training/synonymsEdit', { synonym, focus: 2 });
      }
    });
    if(!found){res.render('404');}
  });    
});

module.exports = router;
