const pool = require('../config/database');

const publicFields = 'id, firstName, lastName, street, city, emailAddress, phoneNumber, isActive';
const allowedFilterFields = [
  'firstName',
  'lastName',
  'emailAddress',
  'city',
  'street',
  'phoneNumber',
  'isActive',
];

// Haalt users op met optionele toegestane filters.
async function findAllUsers(filters = {}) {
  const filterEntries = Object.entries(filters);
  const whereClauses = filterEntries.map(([field]) => `\`${field}\` = ?`);
  const values = filterEntries.map(([, value]) => value);
  const where = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

  const [rows] = await pool.execute(`SELECT ${publicFields} FROM \`user\`${where}`, values);
  return rows;
}

// Haalt een user op basis van ID op zonder wachtwoord.
async function findUserById(userId) {
  const [rows] = await pool.execute(`SELECT ${publicFields} FROM \`user\` WHERE id = ? LIMIT 1`, [userId]);
  return rows[0] || null;
}

// Haalt een user op basis van e-mailadres op zonder wachtwoord.
async function findUserByEmail(emailAddress) {
  const [rows] = await pool.execute(
    `SELECT ${publicFields} FROM \`user\` WHERE emailAddress = ? LIMIT 1`,
    [emailAddress]
  );
  return rows[0] || null;
}

// Maakt een nieuwe user aan en retourneert de publieke usergegevens.
async function createUser(user) {
  const [result] = await pool.execute(
    `INSERT INTO \`user\`
      (firstName, lastName, street, city, emailAddress, password, phoneNumber, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.firstName,
      user.lastName,
      user.street || null,
      user.city || null,
      user.emailAddress,
      user.password,
      user.phoneNumber,
      user.isActive ?? true,
    ]
  );

  return findUserById(result.insertId);
}

// Werkt usergegevens bij en retourneert de publieke usergegevens.
async function updateUser(userId, user) {
  await pool.execute(
    `UPDATE \`user\`
     SET firstName = ?, lastName = ?, street = ?, city = ?, emailAddress = ?, phoneNumber = ?
     WHERE id = ?`,
    [
      user.firstName,
      user.lastName,
      user.street || null,
      user.city || null,
      user.emailAddress,
      user.phoneNumber,
      userId,
    ]
  );

  return findUserById(userId);
}

// Verwijdert een user en geeft terug of er een rij is verwijderd.
async function deleteUser(userId) {
  const [result] = await pool.execute('DELETE FROM `user` WHERE id = ?', [userId]);
  return result.affectedRows > 0;
}

module.exports = {
  allowedFilterFields,
  findAllUsers,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
