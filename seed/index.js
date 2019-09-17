
const mongoose = require('mongoose');
const config = require('../Libs/BotConfig');

var intentsModels = require('../models/intents');
var synonymModel = require('../models/synonyms');

mongoose
    .connect(config.DB, { useNewUrlParser: true })
    .then(async () => {
        console.log('Running seed')
        let intents = require('./intents')
        let synonym = require('./synonyms')

        Promise.all(intents.forEach(async int => {
            await new intentsModels(int).save().then(() => console.log('saved intent')).catch(console.error)
        }))

        Promise.all(synonym.forEach(async syn => {
            await new synonymModel(syn).save().then(() => console.log('saved synonym')).catch(console.error)
        }))
        
        console.log('done')
    }).catch(err => console.log(err)); 