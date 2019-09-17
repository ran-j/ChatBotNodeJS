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
            this.tokenizer = new natural.WordTokenizer();
        } else if (Language == 'fr') {
            natural.PorterStemmerFr.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else if (Language == 'it') {
            natural.PorterStemmerIt.attach();
            this.tokenizer = new natural.WordTokenizer();
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

    _replaceAll(str, needle, replacement) {
        return str.split(needle).join(replacement);
    }

    _setContext(userid, contextText) {
        if (!arr.UserFilter(context, userid)) {
            this.context.push({ uID: userid, ctx: contextText })
        } else {
            this.context[context.findIndex(x => x.uID == userid)].context = contextText;
        }
    }

    _configResponse(sentence) {
        var resp = this._replaceAll(arr.random(sentence), '{botname}', BotName);
        resp = this._replaceAll(resp, '{botversion}', '1.0.0');
        return resp;
    }

    _getFallBack() {
        let rt = ["What did you mean ?", "I'm not understanding you"];
        this.intents.forEach((intent) => {
            if (intent.tag == 'fallback') {
                rt = intent.responses
            }
        })
        return rt;
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
                        if (pattern_words.indexOf(this.words[j]) > -1) {
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
                        this.documents.push([steamWords, intentsList[i].resposta]);
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
                } else {
                    this.isAgentBuilding = false;
                    if (this._debug) {
                        console.log();
                        console.log("documents:", this.documents.length);
                        console.log("classes:", this.classes.length);
                        console.log("unique stemmed words:", this.words.length);
                    }
                    return { error: false, msg: "Building successful" }
                }
            })
        } catch (error) {
            this.isAgentBuilding = false;
            if (this._debug) console.log(error);
            throw error
        }
    }

    async clean_up_sentence(sentence) {
        //stem and tokenize the pattern
        var sentence_words = await this.tokenizer.tokenize(sentence);
        //@depreced
        //fix words
        await synonymModel.find({}).lean().exec((err, synonym) => {
            var i = 0;
            const iMax = sentence_words.length;
            for (; i < iMax; i++) { //sentence_words
                var j = 0;
                const jMax = synonym.length;
                for (; j < jMax; j++) { //synonym
                    var x = 0;
                    const xMax = synonym[i].synonyms.length;
                    for (; x < xMax; x++) { //synonym list
                        if (synonym[i].synonyms[x].toLowerCase() == sentence_words[i].toLowerCase()) {
                            sentence_words[i] = sentence_words[i].replace(sentence_words[i], synonym[i].keyWord);
                        }
                    }
                }
                sentence_words[i] = sentence_words[i].toLowerCase().stem();
            }
        })

        return sentence_words;
    }

    async bow(sentence, show_details) {
        //tokenize the pattern
        var sentence_words = await this.clean_up_sentence(sentence);
        //bag of words
        var bag = new Array(this.words.length).fill(0)

        var i = 0;
        const iMax = sentence_words.length;
        for (; i < iMax; i++) {
            var j = 0;
            const jMax = this.words.length;
            for (; j < jMax; j++) {
                if (sentence_words[i] == this.words[j]) {
                    //set 1 if found the match word and 0 for the others
                    bag[j] = 1;
                    if (show_details) { console.log("found in bag: " + v) }
                }
            }
        }

        return bag;
    }

    async classify(sentence) {
        //load model
        if (!this.model) this.model = await tf.loadLayersModel('file://' + this.modelpath + '/model.json');
        //bow sentence
        const bowData = await this.bow(sentence, this._debug);
        //test if the BowData is a array of zeros
        var NotallZeros = await arr.zeroTest(bowData);
        //Output array
        var return_list = [];
        // teste if the result isn't all zeros
        if (NotallZeros) {
            //to prevente memory leak
            await tf.tidy(() => {
                //converter to tensor array
                var data = tf.tensor2d(bowData, [1, bowData.length]);
                //generate probabilities from the model
                var predictions = this.model.predict(data).dataSync();
                //filter out predictions below a threshold    
                var results = [];
                predictions.map((prediction, index) => {
                    if (prediction > this.CONFIDENCE) {
                        results.push([index, prediction]);
                    }
                });
                //sort by strength of probability    
                results.sort((a, b) => b[1] - a[1]);
                //build array with responses 
                results.forEach((r, i) => {
                    return_list.push([classes[r[0]], r[1]]);
                });
            })
            //return tuple of intent and probability
            if (this._debug) console.log(return_list)
            return return_list
        }
    }

    async response(sentence, userID, show_details) {
        var i = 0;
        var reply = arr.random(await this._getFallBack());
        var results = await this.classify(sentence);
        //if we have a classification then find the matching intent tag
        if (results && results.length > 0) {
            //loop as long as there are matches to process
            while (results[i]) {
                var j = 0;
                const jMax = this.intents.length;
                for (; j < jMax; j++) {
                    //set context for this intent if necessary
                    if (this.intents[j].tag == results[0][0]) {
                        if (arr.inArray('context_set', s)) {
                            //set context
                            this._setContext(userID, s['context_set']);
                            if (show_details) {
                                console.log('context: ' + s['context_set'])
                            }
                        }
                        //check if this intent is contextual and applies to this user's conversation
                        if (!arr.inArray('context_filter', s) || arr.UserFilter(this.context, userID) && arr.inArray('context_filter', s) && s['context_filter'] == this.context[this.context.findIndex(x => x.uID == userID)].ctx) {
                            if (show_details) {
                                console.log('tag: ' + s['tag']);
                            }
                            //remove user context
                            this.context.slice(this.context.findIndex(x => x.uID == userID), 1)
                            //a random response from the intent             
                            reply = this._configResponse(s['responses']);
                        } else {
                            //a random response from the intent             
                            reply = this._configResponse(s['responses']);
                        }
                    }
                }
                results.shift();
                i++;
            }
        }
        return reply;
    }
}


module.exports = Agent