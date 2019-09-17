const natural = require('natural');
const shuffle = require('shuffle-array');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

//models
const synonymModel = require('../models/synonyms');
const intentsModels = require('../models/intents');

//extras
const arr = require('../Libs/ExtraFunctions');
const BotConfig = require('../Libs/BotConfig');

class Agent {
    constructor(Language) {
        this.isAgentBuilding = false;
        if (Language == 'pt') {
            natural.PorterStemmerPt.attach();
            this.tokenizer = new natural.AggressiveTokenizerPt();
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
        // trained model
        this.model = null
    }

    _containsInArray(arr, check) {
        var found = false;
        for (var i = 0; i < check.length; i++) {
            if (arr.indexOf(check[i]) > -1) {
                found = true;
                break;
            }
        }
        return found;
    }

    _sort(A) {
        let result = []
        let i = 0;
        const iMax = A.length;
        for (; i < iMax; i++) {
            if (result.indexOf(A[i]) < 0) {
                result.push(A[i]);
            }
        }
        return result
    }

    async BuildAgent(fullbuild) {
        if (this.isAgentBuilding) return { error: true, msg: "Agent is buinding" }
        try {
            this.isAgentBuilding = true;
            intentsModels.find({}).lean().exec((err, intentsList) => {
                if (err) throw err

                var i = 0;
                const iMax = intentsList.length
                for (; i < iMax; i++) {
                    var j = 0;
                    const jMax = intentsList[i].patterns.length
                    for (; j < jMax; j++) {
                        //stem and tokenize each word in the sentence
                        var wd = this.tokenizer.tokenize(intentsList[i].patterns[j]);
                        var x = 0;
                        const xMax = wd.length
                        //remove ignored words
                        for (; x < xMax; x++) {
                            if (this.ignore_words.indexOf(wd[x]) > -1) {
                                wd.splice(x, 1)
                            }
                        }
                        //stem and lower each word
                        var steamWords = wd.map(word => word.toLowerCase().stem())
                        //add to words list the steam words
                        Array.prototype.push.apply(this.words, steamWords)
                        //add to documents in corpus
                        documents.push([steamWords, intentsList[i].resposta]);
                        //add the tag to classes list 
                        if (!this._containsInArray(this.classes, intentsList[i].tag)) {
                            this.classes.push(intentsList[i].tag);
                        }
                    }
                }
                //sort and remove duplicates
                this.words = arr.removeDups(this._sort(this.words));
                //sort classes
                this.classes = this._sort(this.classes);

                if (this._debug) {
                    console.log("documents:", this.documents.length);
                    console.log("classes:", this.classes.length);
                    console.log("unique stemmed words:", this.words.length);
                }

                if (fullbuild) {
                    if (this._debug) {
                        console.log();
                        console.log('Training...');
                    }
                    this.TrainBuilder().then(() => {
                        this.isAgentBuilding = false;
                        return { error: false, msg: "Building successful" }
                    }).catch((error) => {
                        if (this._debug) console.log(error);
                        this.isAgentBuilding = false;
                        return { error: true, msg: "Core error" }
                    });
                }
            })
        } catch (error) {
            this.isAgentBuilding = false;
            if (this._debug) console.log(error);
            throw error
        }
    }

    TrainBuilder() {
        return new Promise((resolve, reject) => {
            try {
                var i = 0;
                const iMax = this.documents.length
                for (; i < iMax; i++) {
                    //list of tokenized words for the pattern and stem words
                    var pattern_words = this.documents[i][0]
                    var j = 0;
                    const jMax = this.words.length;
                    //initialize bag of words
                    var bag = new Array(jMax).fill(0);
                    //create bag of words array
                    for (; j < jMax; j++) {
                        if (pattern_words.indexOf(this.words[j])) {
                            bag.push(1);
                        }
                    }
                    //create an empty array for output
                    var output_row = new Array(this.classes.length).fill(0);
                    // set '0' for each tag and '1' for current tag  
                    output_row[this.classes.findIndex(x => x == this.documents[i][1])] = 1;
                    //push on the arrays de values  
                    this.training.push([bag, output_row]);
                }
                //shuffle features
                this.training = shuffle(this.training);

                //create train arrays
                var train_x = arr.pick(this.training, 0);
                var train_y = arr.pick(this.training, 1);

                // Build neural network:
                const model = tf.sequential();
                model.add(tf.layers.dense({ units: 256, activation: 'relu', inputShape: [train_x[0].length] }));
                model.add(tf.layers.dropout({ rate: 0.25 }));
                model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
                model.add(tf.layers.dropout({ rate: 0.25 }));
                model.add(tf.layers.dense({ units: train_y[0].length, activation: 'softmax' }));
                model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

                //create tensors
                const xs = tf.tensor(train_x);
                const ys = tf.tensor(train_y);

                //train model
                model.fit(xs, ys, {
                    epochs: 1000,
                    batchSize: 8,
                    shuffle: true,
                    // verbose: 1,
                    callbacks: {
                        onEpochEnd: async (epoch, log) => {
                            console.log(`Epoch ${epoch}: loss = ${log.loss}`);
                        }
                    }
                }).then(() => {
                    if (this._debug) console.log('Saving model....');
                    //Print a text summary of the model's layers.
                    model.summary();
                    model.save('file://' + this.modelpath).then(() => {
                        if (this._debug) {
                            console.log(' ');
                            console.log('Model Saved.');
                            console.log(' ');
                            console.log("documents " + this.documents.length);
                            console.log("classes " + this.classes.length);
                            console.log("unique stemmed words " + this.words.length);
                        }
                        //release memory
                        xs.dispose();
                        ys.dispose();
                        // model.dispose();
                        this.model = model;
                        resolve(true);
                    }).catch(reject)
                }).catch(reject)
            } catch (error) {
                reject(error)
            }
        })
    }
}


module.exports = Agent