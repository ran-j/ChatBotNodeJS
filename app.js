var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
const mlAgent = require("./ml/tensorflowjs")
const config = require('./Libs/BotConfig');

var app = express();

var indexRouter =  require('./routes/index');
var intentsRouter = require('./routes/intents');
global.Agent = new mlAgent('pt')
 
mongoose
  .connect(config.DB,{ useNewUrlParser: true })
  .then(async () => {
    console.log('MongoDB Connected')
    console.log('Starting build agent')
    let resp = await global.Agent.BuildAgent()
    console.log(resp)
  }).catch(err => console.log(err)); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/required', express.static(path.join(__dirname, 'public')));

app.use(session({
  name: 'BotJs',
  secret: 'work ward',
  resave: true,
  saveUninitialized: false,
  //cookie: { maxAge: 24 * 60 * 60 * 1000, secure: true, httpOnly: true },
  // cookie: { maxAge: 24 * 60 * 60 * 1000 },
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));

app.use('/', indexRouter);
app.use('/admin', intentsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.render('404'); 
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if(req.app.get('env') == 'development'){
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }else{
    console.error(err);
    res.render('500');
  }  
});

module.exports = app;
