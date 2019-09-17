var synonymModel = require('../../models/synonyms');

const synonymList = (req, res, next) => {
    synonymModel.find({}, (err, synonym) => {
        var synonyms = synonym.length > 0 ? synonym : require('../Libs/synonyms');
        res.render('Training/synonyms', { synonyms, focus: 2 });
    });
}

const synonymEdit = (req, res, next) => {
    synonymModel.find({}).exec((err, synonyms) => {
        if (!synonyms) { res.render('404'); }
        res.render('Training/synonymsEdit', { synonym, focus: 2 });
    });
}

const synonymCreate = (req, res, next) => {
    res.render('Training/new_synonym', { focus: 2 });
}

module.exports = {
    synonymList,
    synonymEdit,
    synonymCreate
}