const express = require('express');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Share-a-Meal API is running',
    data: {
      version: '1.0.0',
      studentName: config.student.name,
      studentNumber: config.student.number,
      description: config.description,
    },
  });
});

module.exports = router;
