const createRequiredFields = [
  'name',
  'description',
  'price',
  'dateTime',
  'maxAmountOfParticipants',
  'imageUrl',
];

const updateRequiredFields = ['name', 'price', 'maxAmountOfParticipants'];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isValidDate(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

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
