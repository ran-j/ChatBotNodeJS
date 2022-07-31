const natural = require('natural');
const EventEmitter = require('events');
const tf = require('@tensorflow/tfjs-node');
const path = require("path");

//models
const synonymModel = require('../../models/synonyms');
const intentsModels = require('../../models/intents');

//extras
const utils = require('../ExtraFunctions');
const Config = require('../../bin/config');

const Global = require('../../Libs/global');

const Recognizers = require('@microsoft/recognizers-text-suite');
const EntityExtractor = require('../entity-extractor/entity-extractor');

const BotName = Config.BotName

class Agent extends EventEmitter {
    constructor(language, debug = false) {
        super();
        this.isAgentBuilding = false;
        this._debug = debug
        this._setTokenizer(language);
        this._createEntityExtractor(language);
        //path to model already save
        this.modelpath = path.join(Global.RootPath, 'trained-models');
        //train arrays
        this.words = [];
        this.classes = [];
        this.documents = [];
        this.ignore_words = ['?', '!', '.', ','];
        this.context = new Map();
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

    _setTokenizer(language) {
        if (language == 'pt') {
            natural.PorterStemmerPt.attach();
            this.tokenizer = new natural.AggressiveTokenizerPt();
        } else if (language == 'js') {
            natural.StemmerJa.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else if (language == 'fr') {
            natural.PorterStemmerFr.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else if (language == 'it') {
            natural.PorterStemmerIt.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else if (language == 'en') {
            natural.LancasterStemmer.attach();
            this.tokenizer = new natural.WordTokenizer();
        } else {
            throw new Error("Unsupported language.")
        }
    }

    _createEntityExtractor(language) {
        let culture = Recognizers.Culture.English;
        if (language == 'pt') {
            culture = Recognizers.Culture.Portuguese;
        } else if (language == 'js') {
            culture = Recognizers.Culture.Japanese;
        } else if (language == 'fr') {
            culture = Recognizers.Culture.French
        } else if (language == 'it') {
            culture = Recognizers.Culture.Italian
        }

        this.entityExtractor = new EntityExtractor(culture)
    }

    _setContext(userid, contextText) {
        const userContext = this._getContext(userid) ?? [];
        userContext.push(contextText);
        this.context.set(userid, utils.unique(userContext));
    }

    _getContext(userid) {
        return this.context.get(userid)
    }

    _configResponse(sentence) {
        const replaceAll = (str, needle, replacement) => {
            return str.split(needle).join(replacement);
        }
        let resp = replaceAll(utils.random(sentence), '{botname}', BotName);
        resp = replaceAll(resp, '{botversion}', '2.5.3');
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

    _emitAndGetFallback(sentence, response, userID) {
        const fallbackMsg = utils.random(this._getFallBack())
        if (this.debug) console.log(`Registering fallback to user ${userID}`)
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

        this.emit('fallback', sentence, userID, response?.guesses_list);

        return fallbackMsg
    }

    _saveConversation(sentence, userResponse, tag, confidence, userID) {
        this.emit('conversation', [
            {
                msg: sentence,
                is_bot: false,
                time: new Date().toLocaleString()
            },
            {
                msg: userResponse,
                is_bot: true,
                time: new Date().toLocaleString(),
                intent: {
                    tag: tag,
                    confidence: confidence
                }
            }
        ], userID);
    }

    trainBuilder() {
        return new Promise(async (resolve, reject) => {
            try {
                //set model to null to prevent cache
                this.model = null
                //create trains data
                const trainingData = this._createTrainingData()

                //create train arrays
                let train_x = utils.pick(trainingData, 0);
                let train_y = utils.pick(trainingData, 1);

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

                //Print a text summary of the model's layers.
                model.summary();

                if (this._debug) console.log('Saving model....');
                await model.save('file://' + this.modelpath)

                if (this._debug) {
                    console.log(' ');
                    console.log('Model Saved.');
                    console.log(' ');
                    console.log("documents " + this.documents.length);
                    console.log("classes " + this.classes.length);
                    console.log("unique stemmed words " + this.words.length);
                }
                //release tensors from memory
                xs.dispose();
                ys.dispose();
                // model.dispose();
                return resolve(true);
            } catch (error) {
                reject(error)
            }
        })
    }

    buildAgent(fullBuild) {
        return new Promise(async (resolve, reject) => {
            if (this.isAgentBuilding) return { error: true, msg: "Agent is buinding" }
            try {
                this.isAgentBuilding = true;

                const intentsList = await intentsModels.find({}).lean()
                this.intents = intentsList

                const iMax = intentsList.length
                for (let i = 0; i < iMax; i++) {

                    const jMax = intentsList[i].patterns.length
                    for (let j = 0; j < jMax; j++) {
                        //stem and tokenize each word in the sentence
                        const wd = this.tokenizer.tokenize(intentsList[i].patterns[j]);
                        const xMax = wd.length

                        //remove ignored words
                        for (let x = 0; x < xMax; x++) {
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
                        if (!utils.containsInArray(this.classes, intentsList[i].tag)) {
                            this.classes.push(intentsList[i].tag);
                        }
                    }
                }

                //sort and remove duplicates
                this.words = utils.unique(this.words);
                //sort classes
                this.classes = utils.unique(this.classes);

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
                    this.trainBuilder().then(() => {
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
                sentence_words[i] = sentence_words[i].toLowerCase().stem();
                const xMax = synonym[j].synonyms.length;
                for (let x = 0; x < xMax; x++) { //synonym list
                    if (synonym[j].synonyms[x].toLowerCase() === sentence_words[i]) {
                        sentence_words[i] = sentence_words[i].replace(sentence_words[i], synonym[j].keyWord);
                    }
                }
            }
        }
        return sentence_words;
    }

    async bow(sentence) {
        //tokenize the pattern
        const sentence_words = await this.clean_up_sentence(sentence);
        //bag of words
        let bag = new Array(this.words.length).fill(0)

        const iMax = sentence_words.length;
        for (let i = 0; i < iMax; i++) {
            const jMax = this.words.length;
            for (let j = 0; j < jMax; j++) {
                if (sentence_words[i] == this.words[j]) {
                    //set 1 if found the match word and 0 for the others
                    bag[j] = 1;
                    if (this.debug) { console.log("found in bag: " + j) }
                }
            }
        }

        return bag;
    }

    onlyOneTrainSample() {
        return this.intents.length === 1
    }

    classify(sentence, catchGuess = false) {
        return new Promise(async (resolve, reject) => {
            sentence = sentence.toLowerCase();
            //load model
            if (!this.model) this.model = await tf.loadLayersModel('file://' + this.modelpath + '/model.json');
            //bow sentence
            const bowData = await this.bow(sentence);
            //Output array
            let return_list = [];
            let guesses_list = [];
            //test if the BowData is a array of zeros (If enable)
            let NotAllZeros = catchGuess ? true : await utils.zeroTest(bowData);
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

    response(sentence, userID) {
        return new Promise(async (resolve, reject) => {
            try {
                const responses = await this.classify(sentence)
                const results = responses.return_list ?? [];
                const entities = this.entityExtractor.extract(sentence);
                //if we have a classification then find the matching intent tag
                let i = 0;
                //loop as long as there are matches to process
                while (results[i]) {
                    const jMax = this.intents.length;
                    for (let j = 0; j < jMax; j++) {
                        //set context for this intent if necessary
                        if (this.intents[j].tag == results[i][0]) {
                            const intentHasContextSet = utils.hasKey('context_set', this.intents[j])

                            // check if this intent was context set and set it to user context
                            if (intentHasContextSet) {
                                //set context
                                this._setContext(userID, this.intents[j]['context_set']);
                                if (this.debug) console.log('set context: ' + this.intents[j]['context_set'])
                            }

                            const userContext = this._getContext(userID) ?? [];
                            const contextFilterInIntents = utils.hasKey('context_filter', this.intents[j]);
                            const userContextHasFilter = userContext.includes(this.intents[j]['context_filter'])

                            if (
                                !contextFilterInIntents ||
                                (
                                    contextFilterInIntents &&
                                    userContextHasFilter
                                )
                            ) {
                                const userResponse = this._configResponse(this.intents[j]['responses'])
                                if (!intentHasContextSet && userContextHasFilter) {
                                    if (this.debug) console.log('removing context: ' + this.intents[j]['context_filter'])
                                    //clear context after response user
                                    userContext.splice(userContext.indexOf(this.intents[j]['context_filter']), 1)
                                    this._setContext(userID, userContext);
                                }
                                //save conversation
                                this._saveConversation(sentence, userResponse, this.intents[j].tag, results[i][1], userID)
                                //random response

                                return resolve({
                                    response: userResponse,
                                    entities: entities,
                                });
                            }
                        }
                    }
                    i++;
                }
                return resolve({
                    response: this._emitAndGetFallback(sentence, responses, userID),
                    entities: entities,
                })
            } catch (error) {
                console.log(error)
                resolve(error.message)
            }
        })
    }
}


module.exports = Agent