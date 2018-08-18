var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('login');  
});

router.get('/intents', function(req, res, next) {
  require('../models/intents').find({},function(err,inte){
    var intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    res.render('intents', { intents });  
  }); 
});

module.exports = router;
