var express = require('express');
var pickle = require('pickle');
var ntlk = require('natural');
var np = require('numjs');
var model = require('scikit-learn');
var router = express.Router();
 
module.exports = function(app){

var ERROR_THRESHOLD = 0.25;
var words = app.words;
var classes = app.classes;
var train_x = app.train_x;
var train_y = app.train_y;

var intents = require('./../Libs/intents');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Tensorflow JS' }); 
});

router.post('/ask',function(req,res,next){   
  res.status(200).end(response(req.body.say,req.body.uID,true));
});

}

function clean_up_sentence(sentence){
  //tokenize the pattern
  sentence_words = nltk.word_tokenize(sentence);
  //stem each word
  sentence_words.forEach(function(patterns, i){   
    ntlk.LancasterStemmer.attach();
    patterns = word.lower().stem();
  });
  return sentence_words
}

function bow(sentence, words, show_details){
    //tokenize the pattern
    sentence_words = clean_up_sentence(sentence);
    //bag of words
    var bag = new Array(len(words));
    sentence_words.forEach(function(s, i){ 
      words.forEach(function(v, ii){ 
        if(v == s){
          bag[ii] = 1;
          if(show_details){console.log("found in bag: "+w)}
        }
      });
    });
    return(np.array(bag));        
}

function classify(sentence){
    //generate probabilities from the model
    var results = model.predict([bow(sentence, words)])[0];
    //filter out predictions below a threshold
    var aux;
    results.forEach(function(s, i){ 
      if(s > ERROR_THRESHOLD){
        aux.push(s);
      }
    });
    results = aux;
    //sort by strength of probability    
    results.sort(function(first, second) {
      return second[1] - first[1];
    }).reverse();

    var return_list = [];
    results.forEach(function(r, i){ 
      return_list.push([classes[r[0]],r[1]]);
    });
    //return tuple of intent and probability
    return return_list
}

function response(sentence,userID,show_details){
  var context = [];
  var pos;
  var results = classify(sentence);  
  //if we have a classification then find the matching intent tag
  if (results){
    //loop as long as there are matches to process
    while (results[i]) {
      intents.forEach(function(s, i){ 
        //set context for this intent if necessary
        if(s.tag == results[0][0]){
           if(inArray('context_set',s)){
              pos = context.push({uID:userID, context:s['context_set']}) - 1;
              if (show_details){
                console.log('context: ' +s['context_set'])
              }
            }
           //check if this intent is contextual and applies to this user's conversation
           if(!inArray('context_set',s) || inArray(userID,context) &&  inArray('context_filter',s) && s['context_filter'] == context[pos].context){
            console.log('tag: ' +s['tag']);
            //a random response from the intent
            return randomchoice(s['responses']);
           }
        }
      });     
      results.shift();
      i++;
    }
  }
}

function randomchoice(A){
  return A[Math.floor(Math.random() * A.length)];
}

function inArray(key,A){
  if(A[key] != undefined && A[key] != null && A[key].length > 0){
    return true;
  }
  return false;
}

function len(A){
  return A.length;
}