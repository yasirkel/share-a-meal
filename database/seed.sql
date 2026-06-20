USE share_a_meal;

INSERT INTO `user`
  (id, firstName, lastName, street, city, emailAddress, password, phoneNumber, isActive)
VALUES
  (1, 'Demo', 'Cook', 'Hogeschoollaan 1', 'Breda', 'cook@example.com', '$2b$10$t9.4UsdCst0RwzII6Ibqeug4RS/2GbtKk9pNu6zxkGph.JhTHnSo2', '0612345678', TRUE),
  (2, 'Demo', 'Guest', 'Onderwijsboulevard 2', 'Den Bosch', 'guest@example.com', '$2b$10$t9.4UsdCst0RwzII6Ibqeug4RS/2GbtKk9pNu6zxkGph.JhTHnSo2', '0687654321', TRUE)
ON DUPLICATE KEY UPDATE
  firstName = VALUES(firstName),
  lastName = VALUES(lastName),
  street = VALUES(street),
  city = VALUES(city),
  password = VALUES(password),
  phoneNumber = VALUES(phoneNumber),
  isActive = VALUES(isActive);

INSERT INTO meal
  (id, name, description, price, dateTime, maxAmountOfParticipants, imageUrl, cookId, isActive, isVega, isVegan, isToTakeHome, allergenes)
VALUES
  (1, 'Demo pasta pesto', 'Een eenvoudige demo-maaltijd voor de API-presentatie.', 8.50, '2026-07-01 18:30:00', 4, 'https://example.com/images/pasta.jpg', 1, TRUE, TRUE, FALSE, FALSE, 'gluten')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  dateTime = VALUES(dateTime),
  maxAmountOfParticipants = VALUES(maxAmountOfParticipants),
  imageUrl = VALUES(imageUrl),
  cookId = VALUES(cookId),
  isActive = VALUES(isActive),
  isVega = VALUES(isVega),
  isVegan = VALUES(isVegan),
  isToTakeHome = VALUES(isToTakeHome),
  allergenes = VALUES(allergenes);

INSERT INTO meal_participants (mealId, userId)
VALUES (1, 2)
ON DUPLICATE KEY UPDATE mealId = VALUES(mealId);
