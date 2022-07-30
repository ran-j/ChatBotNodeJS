const express = require('express');
const router = express.Router();

const adminController = require("./controllers/adminController")
const intentsController = require("./controllers/intentsControllers")
const synonymsController = require("./controllers/synonymsController")

/* GET admin actions. */
router.get('/', adminController.login)
router.get('/home', adminController.home)

/* GET intents actions. */
router.get('/intents', intentsController.intentsList)
router.get('/edit/:tag', intentsController.intentsEdit)
router.get('/new/training', intentsController.intentsCreate)
router.get('/training/:tag', intentsController.intentsTrainEdit)

/* GET synonyms actions. */
router.get('/synonyms', synonymsController.synonymList)
router.get('/editkey/:keyword', synonymsController.synonymEdit)
router.get('/new/synonym', synonymsController.synonymCreate)

module.exports = router;
