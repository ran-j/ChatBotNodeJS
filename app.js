const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const Agent = require("./Libs/tensorflowjs/agent")
const mlLogs = require("./Libs/AgentEvents")

const config = require('./bin/Config');

global.appRoot = path.resolve(__dirname);
global.AgentInstance = new Agent(config.Language)

const app = express();

const indexRouter = require('./routes/index');
const intentsRouter = require('./routes/intents');
const apisRouter = require('./routes/api');

mongoose
  .connect(config.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB Connected')
    //setup the agent
    console.log('Starting build agent')
    await AgentInstance.buildAgent(false)
    console.log("Agent ready")
    //events
    AgentInstance.on("fallback", mlLogs.logFallback)
    AgentInstance.on("conversation", mlLogs.logConversation)
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

console.log(process.env.MONGODB_URI);

app.use(session({
  secret: config.BotName,
  resave: false,
  store: MongoStore.create({
    mongoUrl: config.DB,
  }),
  saveUninitialized: false,
}));

app.use('/', indexRouter);
app.use('/api', apisRouter);
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
  if (req.app.get('env') == 'development') {
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  } else {
    console.error(err);
    res.render('500');
  }
});

module.exports = app;
