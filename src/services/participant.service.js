const participantDao = require('../dao/participant.dao');

module.exports = {
  findParticipantsByMealId: participantDao.findParticipantsByMealId,
  findParticipantByMealAndUser: participantDao.findParticipantByMealAndUser,
  addParticipant: participantDao.addParticipant,
  removeParticipant: participantDao.removeParticipant,
};
