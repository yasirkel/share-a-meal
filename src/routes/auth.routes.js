const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);

router.get('/auth/validate', authenticateToken, (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Authentication token is valid',
    data: {
      user: req.user,
    },
  });
});

module.exports = router;
