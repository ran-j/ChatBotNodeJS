var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('login');  
});

router.get('/intents', function(req, res, next) {
  res.render('intents', { title: 'Tensorflow JS' });  
});

module.exports = router;
