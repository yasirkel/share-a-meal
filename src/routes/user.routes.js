const express = require('express');
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', userController.register);
router.use(authenticateToken);
router.get('/', userController.getAll);
router.get('/profile', userController.getProfile);
router.get('/:userId', userController.getById);
router.put('/:userId', userController.update);
router.delete('/:userId', userController.remove);

module.exports = router;
