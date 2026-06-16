const express = require('express');
const mealController = require('../controllers/meal.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', mealController.getAll);
router.get('/:mealId', mealController.getById);
router.post('/', authenticateToken, mealController.create);
router.put('/:mealId', authenticateToken, mealController.update);
router.delete('/:mealId', authenticateToken, mealController.remove);

module.exports = router;
