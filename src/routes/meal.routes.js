const express = require('express');
const mealController = require('../controllers/meal.controller');
const participantController = require('../controllers/participant.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', mealController.getAll);
router.post('/:mealId/participate', authenticateToken, participantController.participate);
router.delete('/:mealId/participate', authenticateToken, participantController.unsubscribe);
router.get('/:mealId/participants', authenticateToken, participantController.getParticipants);
router.get('/:mealId/participants/:userId', authenticateToken, participantController.getParticipant);
router.get('/:mealId', mealController.getById);
router.post('/', authenticateToken, mealController.create);
router.put('/:mealId', authenticateToken, mealController.update);
router.delete('/:mealId', authenticateToken, mealController.remove);

module.exports = router;
