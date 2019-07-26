var natural = require('natural');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

//models
const BotConfig = require('../Libs/BotConfig');
var synonymModel = require('../models/synonyms');
var intentsModels = require('../models/intents');

//extras
const arr = require('../Libs/ExtraFunctions');
const BotConfig = require('../Libs/BotConfig');

class Agent {
    constructor(Language) {
        this.isAgentBuilding = false;
        if (Language == 'pt') {
            natural.PorterStemmerPt.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else if (Language == 'js') {
            natural.StemmerJa.attach();
        } else if (Language == 'fr') {
            natural.PorterStemmerFr.attach();
        } else if (Language == 'it') {
            natural.PorterStemmerIt.attach();
        } else if (Language == 'en') { 
            natural.LancasterStemmer.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else {
            throw new Error("Unsupported language.")
        }

        //path to model already save
        this.modelpath = __dirname.replace('ml', 'models/training-models');
        //train arrays
        this.words = [];
        this.classes = [];
        this.documents = [];
        this.ignore_words = ['?'];
        this.training = new Array();
        this.context = [];
        //intents array
        this.intents = [];
        //synonyms array
        this.synonyms = [];
        //confidence to respond
        this.CONFIDENCE = BotConfig.BotConfidence.medium;
        //load bot name
        this.BotName = BotConfig.BotName;
    }

    async BuildAgent (fullbuild) {
        this.isAgentBuilding = true;
        intentsModels.find({}).lean().exec((err, inte) => {
            if(err) throw err

        })

    }


}


module.exports = Agent