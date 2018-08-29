var express = require('express');
var router = express.Router();
var synonymModel = require('../models/synonyms');
var intentsModels = require('../models/intents');

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.render('login');  
});

router.get('/home', (req, res, next) => {
  res.render('index',{ focus: 0 });  
});

router.get('/new/training', (req, res, next) => {   
  res.render('Training/new_intent', { focus: 1 });  
});

router.get('/new/synonym', (req, res, next) => {   
  res.render('Training/new_synonym', { focus: 2 });  
});

router.get('/intents', (req, res, next) => {  
  intentsModels.find({},(err,inte) =>{
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    res.render('Training/intents', { intents, focus: 1 });  
  }); 
});

router.get('/synonyms',(req, res, next) => {  
  synonymModel.find({},(err,synonym) =>{
    var synonyms =  synonym.length > 0 ? synonym : require('../Libs/synonyms');
    res.render('Training/synonyms', { synonyms, focus: 2 });  
  }); 
});

router.get('/edit/:tag',(req, res, next) => {  
  intentsModels.find({},(err,inte) =>{
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    let found = false;
    intents.forEach((intent) =>{
      if(intent.tag == req.params.tag){
        found = true;
        res.render('Training/edit_intents', { intent, focus: 1 });
      }
    });
    if(!found){res.render('404');}
  });    
});

router.get('/training/:tag', (req, res, next) => {  
  intentsModels.find({},(err,inte) =>{
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

router.get('/editkey/:keyword', (req, res, next) => {  
  synonymModel.find({},(err,syn) =>{
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
