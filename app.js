var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ntlk = require('natural');
var shuffle = require('shuffle-array');
var np = require('numjs');
//var model = require('scikit-learn');
//var pickle = require('pickle');

//intents
var intents = require('./Libs/intents');

const myEmitter = new MyEmitter();

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

var words = [], classes = [], documents = [], ignore_words = ['?'];

var train_x, train_y;

//create our training data
var training = [], output = [];

var indexRouter =  require('./routes/index')(app);
var usersRouter = require('./routes/users');

var app = express();

var pickled;

myEmitter.on('load', function(){
  Init();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

function Init(){
	intents.forEach(function(intent, ii){
		intent.patterns.forEach(function(patterns, i){
      tokenizer = new ntlk.TreebankWordTokenizer();
      //tokenize each word in the sentence
      var w = tokenizer.tokenize(patterns);
      //add to our words list
      words.push(w);
      //add to documents in our corpus
      documents.push({val: w, it:intent.tag});
      //add to our classes list
      if(NotcontainsinArray(classes,intent.tag)){
        classes.push(intent.tag);
      }
		});
  });
  //stem and lower each word and remove duplicates 
  words = stemWords(sort(words));
  classes = sort(classes);

  console.log("documents"+ len(documents));
  console.log(documents);
  console.log("classes "+len(classes));
  console.log(classes);
  console.log("unique stemmed words "+ len(words));
  console.log(words);

  Training();
}

function Training(){
  console.log('Training...');
  //create an empty array for our output
  var output_empty = new Array(len(classes));

  documents.forEach(function(doc, i){
    //initialize our bag of words
    var bag = [];
    //list of tokenized words for the pattern
    var pattern_words = doc.val;
    //stem each word
    pattern_words.forEach(function(wd, ii){
      wd = word.toLowerCase().stem();
    });
    //create our bag of words array
    words.forEach(function(w, ii){
      if(NotcontainsinArray(pattern_words,w)){
        bag.push(0);
      }else{
        bag.push(1);
      }
    });
    //output is a '0' for each tag and '1' for current tag
    output_row = output_empty;
    output_row[classes.findIndex(x => x.it==doc.it)] = 1;    
    training.push([bag, output_row]);
  });
  //shuffle our features and turn into np.array
  shuffle(training);
  training = np.array(training);
  //create train and test lists
  train_x = training.pick(null,0);
  train_y = training.pick(null,1);

  //reset underlying graph data
  tf.reset_default_graph();
  //Build neural network
  var net = tf.input_data(shape=[None, len(train_x[0])]);
  net = tf.fully_connected(net, 8);
  net = tf.fully_connected(net, 8);
  net = tf.fully_connected(net, len(train_y[0]), activation='softmax');
  net = tf.regression(net);

  //Define model and setup tensorboard
  var model = tf.DNN(net, tensorboard_dir='tflearn_logs');
  //Start training (apply gradient descent algorithm)
  model.fit(train_x, train_y, n_epoch=1000, batch_size=8, show_metric=True);
  model.save('model.tflearn');

  // pickle.dump( {'words':words, 'classes':classes, 'train_x':train_x, 'train_y':train_y}, function(pickled) {
  //   console.log("pickled:", pickled);
  //   pickled = pickled;    
  // });
}

function NotcontainsinArray(A,value) {
  return A.indexOf(value) < 0;
};

function sort(A){
  var uniqueNames = A.filter(function(item, pos) {
    return a.indexOf(item) == pos;
  });
  return uniqueNames;
}

function stemWords(A){
  var steamarray = [];
  ntlk.LancasterStemmer.attach();
  A.patterns.forEach(function(word, i){
    if(NotcontainsinArray(ignore_words,word)){
      steamarray = word.toLowerCase().stem();
    }    
  });
  return steamarray;
}

function len(A){
  return A.length;
}