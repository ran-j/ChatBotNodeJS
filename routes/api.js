const express = require('express');
const router = express.Router();

const controller = require("./controllers/apiController")
const intentsController = require("./controllers/intentsControllers")
const synonymsController = require("./controllers/synonymsController")

/* POST get response from bot. */
router.post('/ask', controller.ask)

router.post('/build', controller.buildAgent)

router.post('/intent/new', intentsController.intentsSave)

router.post('/intent/delete', intentsController.intentsDelete)

router.post('/intent/update/patterns', intentsController.intentsUpdatePatterns)

router.post('/intent/update/response', intentsController.intentsUpdateResponses)

router.post('/synonym/new', synonymsController.synonymSave)

router.post('/synonym/delete', synonymsController.synonymDelete)

router.post('/synonym/update', synonymsController.synonymUpdate)

module.exports = router;