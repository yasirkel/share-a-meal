const createRequiredFields = [
  'name',
  'description',
  'price',
  'dateTime',
  'maxAmountOfParticipants',
  'imageUrl',
];

const updateRequiredFields = ['name', 'price', 'maxAmountOfParticipants'];

// Controleert of een waarde een niet-lege tekst is.
function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Controleert of een waarde een positief getal is.
function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// Controleert of een waarde een positief geheel getal is.
function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

// Controleert of een waarde als datum gebruikt kan worden.
function isValidDate(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

// Controleert of alle verplichte maaltijdvelden aanwezig zijn.
function validateRequiredFields(payload, requiredFields) {
  const missingField = requiredFields.find((field) => {
    if (field === 'price') {
      return payload[field] === undefined || payload[field] === null;
    }
    if (field === 'maxAmountOfParticipants') {
      return payload[field] === undefined || payload[field] === null;
    }
    return !hasText(payload[field]);
  });

  return missingField ? `${missingField} is required` : null;
}

// Valideert verplichte velden voor het aanmaken of wijzigen van een maaltijd.
function validateMealPayload(payload, options = {}) {
  const requiredFields = options.partial ? updateRequiredFields : createRequiredFields;
  const requiredMessage = validateRequiredFields(payload, requiredFields);

  if (requiredMessage) {
    return requiredMessage;
  }

  if (payload.price !== undefined && !isPositiveNumber(payload.price)) {
    return 'price must be a positive number';
  }

  if (
    payload.maxAmountOfParticipants !== undefined
    && !isPositiveInteger(payload.maxAmountOfParticipants)
  ) {
    return 'maxAmountOfParticipants must be a positive integer';
  }

  if (!options.partial && !isValidDate(payload.dateTime)) {
    return 'dateTime must be a valid date';
  }

  if (payload.dateTime !== undefined && !isValidDate(payload.dateTime)) {
    return 'dateTime must be a valid date';
  }

  return null;
}

module.exports = {
  validateMealPayload,
};
