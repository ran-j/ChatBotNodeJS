var intentsModels = require('../../models/intents');

const intentsList = (req, res, next) => {
    intentsModels.find({}).lean().exec((err, intents) => {
        res.render('Training/intents', { intents, focus: 1 });
    });
}

const intentsEdit = (req, res, next) => {
    intentsModels.find({ tag: req.params.tag }).exec((err, intents) => {
        if (!intents) { return res.render('404'); }
        res.render('Training/edit_intents', { intent, focus: 1 });
    });
}

const intentsCreate = (req, res, next) => {
    res.render('Training/new_intent', { focus: 1 });
}

const intentsTrainEdit = (req, res, next) => {
    intentsModels.find({}).exec((err, intents) => {
        if (!intents) { return res.render('404'); }
        res.render('Training/training', { intent, focus: 1 });
    })
}

module.exports = {
    intentsList,
    intentsEdit,
    intentsCreate,
    intentsTrainEdit
}