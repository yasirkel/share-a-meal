const express = require('express');
const infoRouter = require('./routes/info.routes');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const mealRouter = require('./routes/meal.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/info', infoRouter);
app.use('/api/user', userRouter);
app.use('/api/meal', mealRouter);
app.use('/api', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
