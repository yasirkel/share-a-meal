const participantDao = require('../dao/participant.dao');

// Bundelt deelnemer-gerelateerde databasefuncties voor de controllers.
module.exports = {
  findParticipantsByMealId: participantDao.findParticipantsByMealId,
  findParticipantByMealAndUser: participantDao.findParticipantByMealAndUser,
  addParticipant: participantDao.addParticipant,
  removeParticipant: participantDao.removeParticipant,
};
