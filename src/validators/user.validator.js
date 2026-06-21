const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberPattern = /^06\d{8}$/;

const requiredFields = ['firstName', 'lastName', 'emailAddress', 'password', 'phoneNumber'];

// Controleert of een waarde een niet-lege tekst is.
function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Controleert of een e-mailadres het juiste formaat heeft.
function validateEmailAddress(emailAddress) {
  return hasText(emailAddress) && emailPattern.test(emailAddress);
}

// Controleert of een wachtwoord voldoet aan de sterkte-eisen.
function validatePassword(password) {
  return (
    typeof password === 'string'
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /\d/.test(password)
  );
}

// Controleert of een telefoonnummer een geldig Nederlands mobiel nummer is.
function validatePhoneNumber(phoneNumber) {
  return hasText(phoneNumber) && phoneNumberPattern.test(phoneNumber);
}

// Valideert de verplichte velden en formats van een user.
function validateUserPayload(payload, options = {}) {
  const errors = [];
  const fields = options.requirePassword === false
    ? requiredFields.filter((field) => field !== 'password')
    : requiredFields;

  fields.forEach((field) => {
    if (!hasText(payload[field])) {
      errors.push(`${field} is required`);
    }
  });

  if (payload.emailAddress !== undefined && !validateEmailAddress(payload.emailAddress)) {
    errors.push('emailAddress must be a valid email address');
  }

  if (payload.password !== undefined && !validatePassword(payload.password)) {
    errors.push('password must be at least 8 characters and contain at least 1 uppercase letter and 1 digit');
  }

  if (payload.phoneNumber !== undefined && !validatePhoneNumber(payload.phoneNumber)) {
    errors.push('phoneNumber must be a valid Dutch mobile number');
  }

  return errors;
}

module.exports = {
  validateUserPayload,
};
