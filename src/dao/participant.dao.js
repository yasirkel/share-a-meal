const pool = require('../config/database');

const participantFields = `
  u.id,
  u.firstName,
  u.lastName,
  u.street,
  u.city,
  u.emailAddress,
  u.phoneNumber,
  u.isActive
`;

async function findParticipantsByMealId(mealId) {
  const [rows] = await pool.execute(
    `SELECT ${participantFields}
     FROM meal_participants mp
     INNER JOIN \`user\` u ON u.id = mp.userId
     WHERE mp.mealId = ?`,
    [mealId]
  );

  return rows;
}

async function findParticipantByMealAndUser(mealId, userId) {
  const [rows] = await pool.execute(
    `SELECT ${participantFields}
     FROM meal_participants mp
     INNER JOIN \`user\` u ON u.id = mp.userId
     WHERE mp.mealId = ? AND mp.userId = ?
     LIMIT 1`,
    [mealId, userId]
  );

  return rows[0] || null;
}

async function addParticipant(mealId, userId) {
  await pool.execute(
    'INSERT INTO meal_participants (mealId, userId) VALUES (?, ?)',
    [mealId, userId]
  );

  return findParticipantByMealAndUser(mealId, userId);
}

async function removeParticipant(mealId, userId) {
  const [result] = await pool.execute(
    'DELETE FROM meal_participants WHERE mealId = ? AND userId = ?',
    [mealId, userId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  findParticipantsByMealId,
  findParticipantByMealAndUser,
  addParticipant,
  removeParticipant,
};
