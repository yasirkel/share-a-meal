USE share_a_meal;

INSERT INTO `user`
  (id, firstName, lastName, street, city, emailAddress, password, phoneNumber, isActive)
VALUES
  (1, 'Mariëtte', 'van den Dullemen', 'Hogeschoollaan 1', 'Breda', 'm.vandullemen@server.nl', '$2b$10$VVK7zREpE6TNOzLDxdj7ou53ZfSac2gGD4jmxER0q.aTarp/UW.2W', '0611111111', TRUE),
  (2, 'John', 'Doe', 'Onderwijsboulevard 2', 'Den Bosch', 'j.doe@server.com', '$2b$10$VVK7zREpE6TNOzLDxdj7ou53ZfSac2gGD4jmxER0q.aTarp/UW.2W', '0612425475', TRUE),
  (3, 'Herman', 'Huizinga', 'Lovensdijkstraat 3', 'Breda', 'h.huizinga@server.nl', '$2b$10$VVK7zREpE6TNOzLDxdj7ou53ZfSac2gGD4jmxER0q.aTarp/UW.2W', '0612345678', TRUE),
  (4, 'Marieke', 'Van Dam', 'Stationsplein 4', 'Tilburg', 'm.vandam@server.nl', '$2b$10$VVK7zREpE6TNOzLDxdj7ou53ZfSac2gGD4jmxER0q.aTarp/UW.2W', '0612345678', FALSE),
  (5, 'Henk', 'Tank', 'Markt 5', 'Eindhoven', 'h.tank@server.com', '$2b$10$VVK7zREpE6TNOzLDxdj7ou53ZfSac2gGD4jmxER0q.aTarp/UW.2W', '0612425495', TRUE)
ON DUPLICATE KEY UPDATE
  firstName = VALUES(firstName),
  lastName = VALUES(lastName),
  street = VALUES(street),
  city = VALUES(city),
  emailAddress = VALUES(emailAddress),
  password = VALUES(password),
  phoneNumber = VALUES(phoneNumber),
  isActive = VALUES(isActive);

INSERT INTO meal
  (id, name, description, price, dateTime, maxAmountOfParticipants, imageUrl, cookId, isActive, isVega, isVegan, isToTakeHome, allergenes)
VALUES
  (1, 'Pasta Bolognese met tomaat, spekjes en kaas', 'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!', 12.75, '2022-03-22 17:35:00', 4, 'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg', 1, TRUE, FALSE, FALSE, TRUE, 'gluten,lactose'),
  (2, 'Aubergine uit de oven met feta, muntrijst en tomatensaus', 'Door aubergines in de oven te roosteren worden ze heerlijk zacht. De balsamico maakt ze heerlijk zoet.', 12.75, '2022-05-22 13:35:00', 4, 'https://static.ah.nl/static/recepten/img_RAM_PRD159322_1024x748_JPG.jpg', 2, TRUE, TRUE, FALSE, FALSE, 'noten'),
  (3, 'Spaghetti met tapenadekip uit de oven en frisse salade', 'Perfect voor doordeweeks, maar ook voor gasten tijdens een feestelijk avondje.', 10.75, '2022-05-22 17:30:00', 4, 'https://static.ah.nl/static/recepten/img_099918_1024x748_JPG.jpg', 2, TRUE, FALSE, FALSE, TRUE, 'gluten,lactose'),
  (4, 'Zuurkool met spekjes', 'Heerlijke zuurkoolschotel, dé winterkost bij uitstek.', 4.00, '2022-03-26 21:22:26', 4, 'https://static.ah.nl/static/recepten/img_063387_890x594_JPG.jpg', 3, TRUE, FALSE, FALSE, FALSE, NULL),
  (5, 'Groentenschotel uit de oven', 'Misschien wel de lekkerste schotel uit de oven! En vol vitaminen! Dat wordt smikkelen. Als je van groenten houdt ben je van harte welkom. Wel eerst even aanmelden.', 6.75, '2022-03-26 21:24:46', 6, 'https://www.kikkoman.nl/fileadmin/_processed_/5/7/csm_WEB_Bonte_groenteschotel_6851203953.jpg', 3, TRUE, TRUE, FALSE, TRUE, NULL)
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

DELETE FROM meal_participants
WHERE mealId IN (1, 2, 3, 4, 5);

INSERT IGNORE INTO meal_participants (mealId, userId)
VALUES
  (1, 2),
  (1, 3),
  (1, 5),
  (2, 4),
  (3, 3),
  (3, 4),
  (4, 2),
  (5, 4);
