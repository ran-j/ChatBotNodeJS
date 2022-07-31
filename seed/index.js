
const mongoose = require('mongoose');
const config = require('../bin/Config');

var intentsModels = require('../models/intents');
var synonymModel = require('../models/synonyms');

mongoose
    .connect(config.DB, { useNewUrlParser: true })
    .then(async () => {
        console.log('Running seed')
        let intents = require('./intents')
        let synonym = require('./synonyms')

        await Promise.all(intents.map(int => new intentsModels(int).save()))

        await Promise.all(synonym.map(syn => new synonymModel(syn).save()))
        
        console.log('done')
    }).catch(err => console.log(err));