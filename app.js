if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
} else {
  require('dotenv').config();  // Load the default `.env` file for development
}
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: '*',  // Replace '*' with the actual allowed origin in production
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));  // Enable CORS

// Setup middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); 
app.use(express.static(path.join(__dirname, 'public'))); 

const contactRouter = require('./routes/stainai/contact');
const registerRouter = require('./routes/stainai/user/register');
const resetPasswordRouter = require('./routes/stainai/user/reset-password');
const requestPasswordResetRouter = require('./routes/stainai/user/request-password-reset');
const signinRouter = require('./routes/stainai/user/singin');

app.use('/contact', contactRouter);
app.use('/user/register', registerRouter);
app.use('/user/reset-password', resetPasswordRouter);
app.use('/user/request-password-reset', requestPasswordResetRouter);
app.use('/user/signin', signinRouter);

module.exports = app;