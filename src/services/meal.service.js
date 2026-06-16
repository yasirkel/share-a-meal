const pool = require('../config/database');

const mealFields = `
  m.id,
  m.name,
  m.description,
  m.price,
  m.dateTime,
  m.maxAmountOfParticipants,
  m.imageUrl,
  m.cookId,
  m.isActive,
  m.isVega,
  m.isVegan,
  m.isToTakeHome,
  m.allergenes,
  m.createDate,
  m.updateDate
`;

const userFields = `
  u.id AS cook_id,
  u.firstName AS cook_firstName,
  u.lastName AS cook_lastName,
  u.street AS cook_street,
  u.city AS cook_city,
  u.emailAddress AS cook_emailAddress,
  u.phoneNumber AS cook_phoneNumber,
  u.isActive AS cook_isActive
`;

function toBoolean(value) {
  return value === undefined ? undefined : Boolean(value);
}

function mapCook(row) {
  if (!row.cook_id) {
    return null;
  }

  return {
    id: row.cook_id,
    firstName: row.cook_firstName,
    lastName: row.cook_lastName,
    street: row.cook_street,
    city: row.cook_city,
    emailAddress: row.cook_emailAddress,
    phoneNumber: row.cook_phoneNumber,
    isActive: row.cook_isActive,
  };
}

function mapMeal(row, participants = []) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    dateTime: row.dateTime,
    maxAmountOfParticipants: row.maxAmountOfParticipants,
    imageUrl: row.imageUrl,
    cookId: row.cookId,
    isActive: row.isActive,
    isVega: row.isVega,
    isVegan: row.isVegan,
    isToTakeHome: row.isToTakeHome,
    allergenes: row.allergenes,
    createDate: row.createDate,
    updateDate: row.updateDate,
    cook: mapCook(row),
    participants,
  };
}

async function findParticipantsByMealId(mealId) {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.firstName,
      u.lastName,
      u.street,
      u.city,
      u.emailAddress,
      u.phoneNumber,
      u.isActive
     FROM meal_participants mp
     INNER JOIN \`user\` u ON u.id = mp.userId
     WHERE mp.mealId = ?`,
    [mealId]
  );

  return rows;
}

async function attachParticipants(meal) {
  if (!meal) {
    return null;
  }

  const participants = await findParticipantsByMealId(meal.id);
  return {
    ...meal,
    participants,
  };
}

async function findAllMeals() {
  const [rows] = await pool.execute(
    `SELECT ${mealFields}, ${userFields}
     FROM meal m
     LEFT JOIN \`user\` u ON u.id = m.cookId`
  );

  const meals = rows.map((row) => mapMeal(row));
  return Promise.all(meals.map(attachParticipants));
}

async function findMealById(mealId) {
  const [rows] = await pool.execute(
    `SELECT ${mealFields}, ${userFields}
     FROM meal m
     LEFT JOIN \`user\` u ON u.id = m.cookId
     WHERE m.id = ?
     LIMIT 1`,
    [mealId]
  );

  return attachParticipants(mapMeal(rows[0]));
}

async function createMeal(meal, cookId) {
  const [result] = await pool.execute(
    `INSERT INTO meal
      (name, description, price, dateTime, maxAmountOfParticipants, imageUrl,
       cookId, isActive, isVega, isVegan, isToTakeHome, allergenes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.name,
      meal.description,
      meal.price,
      meal.dateTime,
      meal.maxAmountOfParticipants,
      meal.imageUrl,
      cookId,
      meal.isActive ?? true,
      toBoolean(meal.isVega) ?? false,
      toBoolean(meal.isVegan) ?? false,
      toBoolean(meal.isToTakeHome) ?? false,
      meal.allergenes || null,
    ]
  );

  return findMealById(result.insertId);
}

async function updateMeal(mealId, meal) {
  await pool.execute(
    `UPDATE meal
     SET name = ?,
         description = COALESCE(?, description),
         price = ?,
         dateTime = COALESCE(?, dateTime),
         maxAmountOfParticipants = ?,
         imageUrl = COALESCE(?, imageUrl),
         isActive = COALESCE(?, isActive),
         isVega = COALESCE(?, isVega),
         isVegan = COALESCE(?, isVegan),
         isToTakeHome = COALESCE(?, isToTakeHome),
         allergenes = COALESCE(?, allergenes)
     WHERE id = ?`,
    [
      meal.name,
      meal.description || null,
      meal.price,
      meal.dateTime || null,
      meal.maxAmountOfParticipants,
      meal.imageUrl || null,
      meal.isActive,
      toBoolean(meal.isVega),
      toBoolean(meal.isVegan),
      toBoolean(meal.isToTakeHome),
      meal.allergenes || null,
      mealId,
    ]
  );

  return findMealById(mealId);
}

async function deleteMeal(mealId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM meal_participants WHERE mealId = ?', [mealId]);
    const [result] = await connection.execute('DELETE FROM meal WHERE id = ?', [mealId]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAllMeals,
  findMealById,
  createMeal,
  updateMeal,
  deleteMeal,
};
