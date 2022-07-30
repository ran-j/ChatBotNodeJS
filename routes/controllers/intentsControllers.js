const intentsModels = require('../../models/intents');

const intentsList = (req, res, next) => {
    intentsModels.find({}).lean().exec((err, intents) => {
        res.render('Training/intents', { intents, focus: 1 });
    });
}

const intentsEdit = (req, res, next) => {
    intentsModels.findOne({ tag: req.params.tag }).lean().exec((err, intent) => {
        if (!intent) { return res.render('404'); }
        res.render('Training/edit_intents', { intent, focus: 1 });
    });
}

const intentsCreate = (req, res, next) => {
    res.render('Training/new_intent', { focus: 1 });
}

const intentsTrainEdit = (req, res, next) => {
    intentsModels.findOne({ tag: req.params.tag }).lean().exec((err, intent) => {
        if (!intent) { return res.render('404'); }
        res.render('Training/training', { intent, focus: 1 });
    })
}

const intentsSave = (req, res, next) => {
    if (!req.body.tag && !req.body.title) return res.status(400).end("invalid data")
    new intentsModels({
        tag: req.body.tag,
        patterns: JSON.parse(req.body.patterns),
        title: req.body.title,
        responses: JSON.parse(req.body.response)
    }).save()
        .then(() => res.status(200).end('Intent created'))
        .catch((err) => {
            console.error(err);
            if (err.code == 11000) return res.status(403).end('Intent already exist.');
            res.status(500).end('Internal error');
        })
}

const intentsDelete = (req, res, next) => {
    intentsModels.findOneAndDelete({ tag: req.body.tag }).exec((err, data) => {
        if (err) {
            console.error(err)
            return res.status(500).end('Error');
        }
        if (data) return res.status(200).end('Intent deleted');
        res.status(200).end('Intent not found');
    })
}

const intentsUpdatePatterns = (req, res, next) => {
    const id = req.body.id;
    const toDelete = JSON.parse(req.body.delete);
    const toAdd = JSON.parse(req.body.add);
    if (!id) return res.status(400).end('Id not provided')
    intentsModels.findById(id).exec((err, intents) => {
        if (!intents) return res.status(400).end('Intent not found')
        let newPattern = [];
        if (toDelete.length > 0) {
            intents.patterns.forEach((el) => {
                if (!toDelete.indexOf(el) > -1) {
                    newPattern.push(el);
                }
            })
        } else {
            newPattern = intents.patterns;
        }
        if (toAdd.length > 0) {
            newPattern = newPattern.concat(toAdd);
        }
        intents.patterns = newPattern;
        intents.save().then(() => {
            res.status(200).end('Update successfully')
        }).catch((err) => {
            console.error(err)
            res.status(500).end("internal Error")
        })
    })
}

const intentsUpdateResponses = (req, res, next) => {
    const id = req.body.id;
    const toDelete = JSON.parse(req.body.delete);
    const toAdd = JSON.parse(req.body.add);
    if (!id) return res.status(400).end('Id not provided')
    intentsModels.findById(id).exec((err, intents) => {
        if (!intents) return res.status(400).end('Intent not found')
        let newResponses = [];
        if (toDelete.length > 0) {
            intents.patterns.forEach((el) => {
                if (!toDelete.indexOf(el) > -1) {
                    newResponses.push(el);
                }
            })
        } else {
            newResponses = intents.patterns;
        }
        if (toAdd.length > 0) {
            newResponses = newResponses.concat(toAdd);
        }
        intents.responses = newResponses;
        intents.save().then(() => {
            res.status(200).end('Update successfully')
        }).catch((err) => {
            console.error(err)
            res.status(500).end("internal Error")
        })
    })
}

module.exports = {
    intentsList,
    intentsEdit,
    intentsCreate,
    intentsTrainEdit,
    //posts
    intentsSave,
    intentsDelete,
    intentsUpdatePatterns,
    intentsUpdateResponses
}