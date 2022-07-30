const natural = require('natural');
const shuffle = require('shuffle-array');
const EventEmitter = require('events');
const tf = require('@tensorflow/tfjs-node');
const path = require("path");

let tfNodeLoaded = false
try {
    require('@tensorflow/tfjs-node');
    tfNodeLoaded = true
} catch (error) {
    console.warn('@tensorflow/tfjs-node not loaded')
}

//models
const synonymModel = require('../../models/synonyms');
const intentsModels = require('../../models/intents');

//extras
const arr = require('../ExtraFunctions');
const Config = require('../../bin/config');

const Global = require('../../Libs/global');

const BotName = Config.BotName

class Agent extends EventEmitter {
    constructor(Language, debug = false) {
        super();
        this.isAgentBuilding = false;
        // this._debug = true
        this._debug = true
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
        this.modelpath = path.join(Global.RootPath, 'trained-models');
        //train arrays
        this.words = [];
        this.classes = [];
        this.documents = [];
        this.ignore_words = ['?'];
        this.context = [];
        //intents array
        this.intents = [];
        //synonyms array
        this.synonyms = [];
        //confidence to respond
        this.CONFIDENCE = Config.BotConfidence.medium;
        //load bot name
        this.BotName = Config.BotName;
        // trained model
        this.model = null
    }

    _containsInArray(arr, check) {
        let found = false;
        for (let i = 0; i < check.length; i++) {
            if (arr.indexOf(check[i]) > -1) {
                found = true;
                break;
            }
        }
        return found;
    }

    _sort(A) {
        let result = []
        const iMax = A.length;
        for (let i = 0; i < iMax; i++) {
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
        let resp = this._replaceAll(arr.random(sentence), '{botname}', BotName);
        resp = this._replaceAll(resp, '{botversion}', '2.5.3');
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

    _createModel(trainXSize, trainYSize) {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 256, activation: 'relu', inputShape: [trainXSize] }));
        model.add(tf.layers.dropout({ rate: 0.25 }));
        model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: 0.25 }));
        model.add(tf.layers.dense({ units: trainYSize, activation: 'softmax' }));

        model.compile({
            optimizer: tf.train.adam(),
            loss: tf.losses.softmaxCrossEntropy,
            metrics: ['accuracy']
        });

        return model;
    }

    _createTrainingData() {
        const iMax = this.documents.length;
        let training = new Array(iMax);
        for (let i = 0; i < iMax; i++) {
            //list of tokenized words for the pattern and stem words
            let pattern_words = this.documents[i][0]
            const jMax = this.words.length;
            //initialize bag of words
            let bag = new Array(jMax).fill(0);
            //create bag of words array
            for (let j = 0; j < jMax; j++) {
                if (pattern_words.indexOf(this.words[j]) > -1) {
                    bag[j] = 1;
                }
            }
            //create an empty array for output
            let output_row = new Array(this.classes.length).fill(0);
            // set '0' for each tag and '1' for current tag  
            output_row[this.classes.findIndex(x => x == this.documents[i][1])] = 1;
            //push on the arrays de values  
            training[i] = ([bag, output_row]);
        }
        //shuffle features
        tf.util.shuffle(training)
        return training
    }

    TrainBuilder() {
        return new Promise(async (resolve, reject) => {
            try {
                const trainingData = this._createTrainingData()

                //create train arrays
                let train_x = arr.pick(trainingData, 0);
                let train_y = arr.pick(trainingData, 1);

                // Build neural network:
                const model = this._createModel(train_x[0].length, train_y[0].length);

                //create tensors
                const xs = tf.tensor(train_x);
                const ys = tf.tensor(train_y);

                //train model
                this.model = await model.fit(xs, ys, {
                    epochs: 300,
                    batchSize: 8,
                    shuffle: true,
                    // verbose: 1,
                    callbacks: {
                        onEpochEnd: async (epoch, log) => {
                            console.log(`Epoch ${epoch}: loss = ${log.loss}`);
                        }
                    }
                })

                if (this._debug) console.log('Saving model....');
                //Print a text summary of the model's layers.
                model.summary();
                console.log(this.modelpath)

                await model.save('file://' + this.modelpath)

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
                return resolve(true);
            } catch (error) {
                reject(error)
            }
        })
    }

    BuildAgent(fullBuild) {
        return new Promise(async (resolve, reject) => {
            if (this.isAgentBuilding) return { error: true, msg: "Agent is buinding" }
            try {
                this.isAgentBuilding = true;
                const intentsList = await intentsModels.find({}).lean()
                const iMax = intentsList.length
                this.intents = intentsList
                for (let i = 0; i < iMax; i++) {
                    const jMax = intentsList[i].patterns.length
                    for (let j = 0; j < jMax; j++) {
                        //stem and tokenize each word in the sentence
                        const wd = this.tokenizer.tokenize(intentsList[i].patterns[j]);
                        let x = 0;
                        const xMax = wd.length
                        //remove ignored words
                        for (; x < xMax; x++) {
                            if (this.ignore_words.indexOf(wd[x]) > -1) {
                                wd.splice(x, 1)
                            }
                        }
                        //stem and lower each word
                        let steamWords = wd.map(word => word.toLowerCase().stem())
                        //add to words list the steam words
                        Array.prototype.push.apply(this.words, steamWords)
                        //add to documents in corpus
                        this.documents.push([steamWords, intentsList[i].tag]);
                        //add the tag to classes list 
                        if (!this._containsInArray(this.classes, intentsList[i].tag)) {
                            this.classes.push(intentsList[i].tag);
                        }
                    }
                }
                //sort and remove duplicates
                this.words = this._sort(arr.removeDups(this.words));
                //sort classes
                this.classes = this._sort(this.classes);

                if (this._debug) {
                    console.log("documents:", this.documents.length);
                    console.log("classes:", this.classes.length);
                    console.log("unique stemmed words:", this.words.length);
                }

                if (fullBuild) {
                    if (this._debug) {
                        console.log();
                        console.log('Training...');
                    }
                    this.TrainBuilder().then(() => {
                        this.isAgentBuilding = false;
                        return resolve({ error: false, msg: "Building successful" })
                    }).catch((error) => {
                        if (this._debug) console.log(error);
                        this.isAgentBuilding = false;
                        return resolve({ error: true, msg: "Core error" })
                    });
                } else {
                    this.isAgentBuilding = false;
                    if (this._debug) {
                        console.log();
                        console.log("documents:", this.documents.length);
                        console.log("classes:", this.classes.length);
                        console.log("unique stemmed words:", this.words.length);
                    }
                    return resolve({ error: false, msg: "Building successful" })
                }

            } catch (error) {
                this.isAgentBuilding = false;
                if (this._debug) console.log(error);
                reject(error)
            }
        })
    }

    async clean_up_sentence(sentence) {
        //stem and tokenize the pattern
        let sentence_words = this.tokenizer.tokenize(sentence);
        //fix words
        const synonym = await synonymModel.find({}).lean()
        const iMax = sentence_words.length;
        for (let i = 0; i < iMax; i++) { //sentence_words         
            const jMax = synonym.length;
            for (let j = 0; j < jMax; j++) { //synonym
                const xMax = synonym[j].synonyms.length;
                for (let x = 0; x < xMax; x++) { //synonym list
                    if (synonym[j].synonyms[x].toLowerCase() == sentence_words[i].toLowerCase()) {
                        sentence_words[i] = sentence_words[i].replace(sentence_words[i], synonym[j].keyWord);
                    }
                }
            }
            sentence_words[i] = sentence_words[i].toLowerCase().stem();
        }
        return sentence_words;
    }

    async bow(sentence, show_details) {
        //tokenize the pattern
        let sentence_words = await this.clean_up_sentence(sentence);
        //bag of words
        let bag = new Array(this.words.length).fill(0)

        const iMax = sentence_words.length;
        for (let i = 0; i < iMax; i++) {
            const jMax = this.words.length;
            for (let j = 0; j < jMax; j++) {
                if (sentence_words[i] == this.words[j]) {
                    //set 1 if found the match word and 0 for the others
                    bag[j] = 1;
                    if (show_details) { console.log("found in bag: " + j) }
                }
            }
        }

        return bag;
    }

    onlyOneTrainSample() {
        return this.intents.length === 1
    }

    classify(sentence, catchGuess = false) {
        sentence = sentence.toLowerCase();
        return new Promise(async (resolve, reject) => {
            //load model
            if (!this.model) this.model = await tf.loadLayersModel('file://' + this.modelpath + '/model.json');
            //bow sentence
            const bowData = await this.bow(sentence, this._debug);
            //Output array
            let return_list = [];
            let guesses_list = [];
            //test if the BowData is a array of zeros (If enable)
            let NotAllZeros = catchGuess ? true : await arr.zeroTest(bowData);
            // test if the result isn't all zeros
            if (NotAllZeros) {
                //to prevent memory leak
                tf.tidy(() => {
                    //to prevent dense input error shape
                    if (this.onlyOneTrainSample()) {
                        return resolve({ return_list: [[this.intents[0].tag, 1]], guesses_list: [] })
                    }
                    //converter to tensor array
                    let data = tf.tensor2d(bowData, [1, bowData.length]);
                    //generate probabilities from the model
                    let predictions = this.model.predict(data).dataSync();
                    //filter out predictions below a threshold    
                    let results = [];
                    let guesses = [];
                    predictions.map((prediction, index) => {
                        if (prediction > this.CONFIDENCE) {
                            results.push([index, prediction]);
                        } else {
                            if (prediction > (this.CONFIDENCE / 2)) { //to be a guesses should be half of the current confidence
                                guesses.push([index, prediction]);
                            }
                        }
                    });
                    if (results.length) {
                        //sort by strength of probability    
                        results.sort((a, b) => b[1] - a[1]);
                        //build array with responses 
                        results.forEach((r, i) => {
                            return_list.push([this.classes[r[0]], r[1]]);
                        });
                    } else {
                        //sort by strength of probability    
                        guesses.sort((a, b) => b[1] - a[1]);
                        //build array with responses 
                        guesses.forEach((r, i) => {
                            guesses_list.push([this.classes[r[0]], r[1]]);
                        });
                    }
                    //return tuple of intent and probability
                    if (this._debug) console.log(return_list)
                    resolve({ return_list, guesses_list })
                })
            } else {
                resolve({ return_list, guesses_list })
            }
        })
    }

    response(sentence, userID, show_details) {
        return new Promise(async (resolve, reject) => {
            try {
                let i = 0;
                this.classify(sentence).then((response) => {
                    let results = response.return_list;
                    //if we have a classification then find the matching intent tag
                    if (results && results.length > 0) {
                        //loop as long as there are matches to process
                        while (results[i]) {
                            const jMax = this.intents.length;
                            for (let j = 0; j < jMax; j++) {
                                //set context for this intent if necessary
                                if (this.intents[j].tag == results[0][0]) {

                                    if (arr.inArray('context_set', this.intents[j])) {
                                        //set context
                                        this._setContext(userID, this.intents[j]['context_set']);
                                        if (show_details) console.log('context: ' + this.intents[j]['context_set'])
                                    }

                                    let userResponse = this._configResponse(this.intents[j]['responses'])

                                    //save conversation
                                    this.emit('conversation', [{ msg: sentence, is_bot: false, time: new Date().toLocaleString() }, { msg: userResponse, is_bot: true, time: new Date().toLocaleString(), intent: { tag: this.intents[j].tag, confidence: results[0][1] } }], userID);

                                    //check if this intent is contextual and applies to this user's conversation
                                    if (!arr.inArray('context_filter', this.intents[j])
                                        || arr.UserFilter(this.context, userID)
                                        && arr.inArray('context_filter', this.intents[j])
                                        && this.intents[j]['context_filter'] == this.context[this.context.findIndex(x => x.uID == userID)].ctx) {
                                        if (show_details) console.log('tag: ' + this.intents[j]['tag']);
                                        //remove user context
                                        this.context.slice(this.context.findIndex(x => x.uID == userID), 1)
                                        //a random response from the intent             
                                        return resolve(userResponse);
                                    } else {
                                        //a random response from the intent             
                                        return resolve(userResponse);
                                    }
                                }
                            }
                            results.shift();
                            i++;
                        }
                    } else {
                        let fallbackMsg = arr.random(this._getFallBack())
                        if (show_details) console.log(`Registering fallback to user ${userID}`)
                        this.emit('conversation', [
                            {
                                msg: sentence,
                                is_bot: false,
                                time: new Date().toLocaleString()
                            },
                            {
                                msg: fallbackMsg,
                                is_bot: true,
                                time: new Date().toLocaleString(),
                                intent: null
                            },
                        ], userID);
                        this.emit('fallback', sentence, userID, response.guesses_list);
                        resolve(fallbackMsg)
                    }
                }).catch((err) => {
                    console.error(err)
                    resolve("Sorry, Internal error >X(")
                })
            } catch (error) {
                console.log(error)
                resolve("Internal error >X(")
            }
        })
    }
}


module.exports = Agent