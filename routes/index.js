var express = require('express');
var natural = require('natural');
var shuffle = require('shuffle-array');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const arr = require('../Libs/ExtraFunctions');
const BotConfig = require('../Libs/BotConfig');

var router = express.Router();

//intents array
var intents = [];

//synonyms array
var synonyms = [];

//confidence to respond
var CONFIDENCE = BotConfig.BotConfidence.medium;
//load bot name
var BotName = BotConfig.BotName;

//path to model already save
var modelpath = __dirname.replace('routes','models/training-models');

var words = [], classes = [], documents = [], ignore_words = ['?'];

//Training data
var training = new Array();

//init modules and training
BuildAgent();

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.render('chat', { title: 'Tensorflow JS' }); 
});

/* POST get response from bot. */
router.post('/ask',async (req, res, next) => {  
  try {
    var resp = await response(req.body.say,req.body.uID,true);
    res.status(200).end(resp);
  } catch (error) {
    res.status(500).end(error);
  }   
});

async function clean_up_sentence(sentence){  
    var tokenizer = new natural.WordTokenizer();
    //stem and tokenize the pattern
    sentence_words = await tokenizer.tokenize(sentence);

    await require('../models/synonyms').find({},function(err,synonym){
      synonyms =  synonym.length > 0 ?  synonym : require('../Libs/synonyms');
    });

    await sentence_words.forEach(function(word,i){
      synonyms.forEach(function(syn){           
        syn.synonyms.forEach(function(syns){
          natural.LancasterStemmer.attach();
          if(syns.toLowerCase() == word.toLowerCase()){
            sentence_words[i] = word.replace(word,syn.keyWord).toLowerCase().stem();
          }else{
            sentence_words[i] = sentence_words[i].toLowerCase().stem();
          }
        })       
      })
    })   

    //return wordslist
    return sentence_words;
}

async function bow(sentence, show_details){
    //tokenize the pattern
    var sentence_words = await clean_up_sentence(sentence);
    //bag of words
    var bag = new Array(words.length + 1).join('0').split('').map(parseFloat);
    sentence_words.forEach(function(s, i){ 
      words.forEach(function(v, ii){ 
        if(v == s){
          //set 1 if found the match word and 0 for the others
          bag[ii] = 1;
          if(show_details){console.log("found in bag: "+v)}
        }
      });
    });
    return bag;       
}

async function classify(sentence){
    //load model
    var model = await tf.loadModel('file://'+modelpath+'/model.json');
    //bow sentence
    const bowData = await bow(sentence, true);
    //converter to tensor array
    var data = await tf.tensor2d(bowData, [1, bowData.length]);
     //generate probabilities from the model
    var predictions = await model.predict(data).dataSync();
    //filter out predictions below a threshold    
    var results = [];
    predictions.map((prediction, index, array) => {
      if(prediction > CONFIDENCE){
        results.push([index,prediction]);
      }      
    });
    //sort by strength of probability    
    results.sort(function(a, b){return a - b}).reverse();
    var return_list = [];
    results.forEach(function(r, i){ 
      return_list.push([classes[r[0]],r[1]]);
    });
    //return tuple of intent and probability
    return return_list
}

async function response(sentence,userID,show_details){
  var context = [];
  var pos;
  var reply = arr.randomchoice(intents[0].responses);
  var i = 0;
  var results = await classify(sentence);  
  //if we have a classification then find the matching intent tag
  if (results){
    //loop as long as there are matches to process
    while (results[i]) {
      intents.forEach(function(s, i){ 
        //set context for this intent if necessary
        if(s.tag == results[0][0]){
           if(arr.inArray('context_set',s)){
              pos = context.push({uID:userID, context:s['context_set']}) - 1;
              if (show_details){
                console.log('context: ' +s['context_set'])
              }
            }
           //check if this intent is contextual and applies to this user's conversation
           if(!arr.inArray('context_set',s) || !arr.NotcontainsinArray(context,userID) &&  arr.inArray('context_filter',s) && s['context_filter'] == context[pos].context){
            console.log('tag: ' +s['tag']);
            //a random response from the intent             
            reply = arr.randomchoice(s['responses']);                         
           }
        }
      });     
      results.shift();
      i++;
    }
  }
  //console.log(reply)
  return reply;
}

async function BuildAgent(){ 
    await require('../models/intents').find({},function(err,inte){
      intents =  inte.length > 0 ?  inte : require('../Libs/intents');
    });
   
    intents.forEach(function(intent, ii){
      intent.patterns.forEach(function(patterns, i){   
        if(arr.isNotInArray(ignore_words,patterns)){  
          //stem and tokenize each word in the sentence
          natural.LancasterStemmer.attach();
          var wd = patterns.toLowerCase().tokenizeAndStem();           
          //add to words list
          words.push(wd);
          //add to documents in corpus
          documents.push([wd,intent.tag]);         
        }
        //add the tag to classes list 
        if(!arr.ContainsinArray(classes,intent.tag)){
          classes.push(intent.tag);
        }
      });
    });
    //stem and lower each word and remove duplicates 
    words = arr.sort(arr.multiDimensionalUnique(arr.toOneArray(words)));
    classes = arr.sort(classes);

    await TrainBuilder();          
}

async function TrainBuilder(){
  console.log(' ');
  console.log('Training...'); 
 
  documents.forEach(function(doc, i){
    //initialize bag of words
    var bag = [];
    //list of tokenized words for the pattern and stem each word
    var pattern_words = doc[0].map((it, i, A) => {
      natural.LancasterStemmer.attach();
      it = it.toLowerCase().stem();
      return it;
    });    
    //create bag of words array
    words.forEach(function(word, ii){
      if(!arr.NotcontainsinArray(pattern_words,word)){
        bag.push(1);
      }else{
        bag.push(0);
      }
    });
    //create an empty array for output
    var output_row = new Array(classes.length + 1).join('0').split('').map(parseFloat);
    // set '0' for each tag and '1' for current tag
    output_row[classes.findIndex(x => x==doc[1])] = 1;  
    //push on the arrays de values  
    training.push([bag, output_row]);
  });
  //shuffle features
  training = shuffle(training);
 
  //create train arrays
  var train_x = arr.pick(training,0);
  var train_y = arr.pick(training,1);
 
  // Build neural network:
  const model = tf.sequential();
  model.add(tf.layers.dense({units: training.length, activation: 'relu', inputShape: [train_x[0].length]}));
  model.add(tf.layers.dense({units: train_y[0].length, activation: 'linear'}));
  model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});

  const xs = tf.tensor(train_x);
  const ys = tf.tensor(train_y);

  //train model
  model.fit(xs, ys, {
    epochs: 1000,
    batchSize: 8,
    callbacks: {
      onEpochEnd: async (epoch, log) => {
        console.log(`Epoch ${epoch}: loss = ${log.loss}`);
      }
    }
  }).then(async () => {;
    console.log('Saving model....'); 
    await model.save('file://'+modelpath);
    console.log('Model Saved.'); 
    
    console.log("documents "+ documents.length);
    console.log(documents);
    console.log("classes "+classes.length);
    console.log(classes);
    console.log("unique stemmed words "+ words.length);
    console.log(words); 
  });
}

module.exports = router;
