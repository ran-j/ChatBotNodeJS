var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

var indexRouter =  require('./routes/index');
var intentsRouter = require('./routes/intents');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/required', express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', intentsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('404'); 
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if(req.app.get('env') == 'development'){
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }else{
    res.render('500');
  }  
});

module.exports = app;

