const SynonymModel = require('../../models/synonyms');

const synonymList = (req, res, next) => {
    SynonymModel.find({}).exec((err, synonyms) => {      
        res.render('Training/synonyms', { synonyms, focus: 2 });
    });
}

const synonymEdit = (req, res, next) => {
    SynonymModel.findOne({}).exec((err, synonym) => {
        if (!synonym) { res.render('404'); }
        res.render('Training/synonymsEdit', { synonym, focus: 2 });
    });
}

const synonymCreate = (req, res, next) => {
    res.render('Training/new_synonym', { focus: 2 });
}

const synonymSave = (req, res, next) => {
    if (!req.body.wd && !req.body.title) return res.status(400).end("invalid data")
    new SynonymModel({
        title: req.body.title,
        keyWord: req.body.wd,
        synonyms: JSON.parse(req.body.synonyms)
    }).save()
        .then(() => res.status(200).end('Synonym created'))
        .catch((err) => {
            console.error(err);
            if (err.code == 11000) return res.status(403).end('Synonym already exist.');
            res.status(500).end('Internal error');
        })
}

const synonymDelete = (req, res, next) => {
    SynonymModel.findOneAndDelete({ keyWord: req.body.tag }).exec((err, data) => {
        if (err) {
            console.error(err)
            return res.status(500).end('Error');
        }
        if (data) return res.status(200).end('Synonym deleted');
        res.status(200).end('Synonym not found');
    })
}

const synonymUpdate = (req, res, next) => {
    const id = req.body.id;
    const toDelete = JSON.parse(req.body.delete);
    const toAdd = JSON.parse(req.body.add);
    if (!id) return res.status(400).end('Id not provided')
    SynonymModel.findById(id).exec((err, synonyms) => {
        if (!synonyms) return res.status(400).end('Intent not found')
        let newSynonym = [];
        if (toDelete.length > 0) {
            synonyms.synonyms.forEach((el) => {
                if (!toDelete.indexOf(el) > -1) {
                    newSynonym.push(el);
                }
            })
        } else {
            newSynonym = synonyms.synonyms;
        }
        if (toAdd.length > 0) {
            newSynonym = newSynonym.concat(toAdd);
        }
        synonyms.synonyms = newSynonym;
        synonyms.save().then(() => {
            res.status(200).end('Update successfully')
        }).catch((err) => {
            console.error(err)
            res.status(500).end("internal Error")
        })
    })
}

module.exports = {
    synonymList,
    synonymEdit,
    synonymCreate,
    //posts 
    synonymSave,
    synonymDelete,
    synonymUpdate
}