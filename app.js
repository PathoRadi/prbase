require('dotenv').config()

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userInfoRouter = require('./routes/userInfo');
var uploadInfoRouter = require('./routes/uploadInfo');
var resetPasswordRouter = require('./routes/resetPassword');
var singinRouter = require('./routes/singin');
var forgetPasswordRouter = require('./routes/forgetPassword');

var app = express();
const cors=require("cors");
const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

app.use(cors(corsOptions)) // Use this after the variable declaration

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/uploadInfo', uploadInfoRouter);
app.use('/userInfo', userInfoRouter);

app.use('/singin', singinRouter);
app.use('/resetPassword', resetPasswordRouter);
app.use('/forgetPassword', forgetPasswordRouter);

module.exports = app;