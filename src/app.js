const express = require('express');
const infoRouter = require('./routes/info.routes');
const authRouter = require('./routes/auth.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/info', infoRouter);
app.use('/api', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
