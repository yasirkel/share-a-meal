const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const authService = require('../services/auth.service');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

// Valideert de loginvelden voordat de database wordt geraadpleegd.
function validationMessage(emailAddress, password) {
  if (!emailAddress || !password) {
    return 'emailAddress and password are required';
  }
  if (typeof emailAddress !== 'string' || !emailPattern.test(emailAddress)) {
    return 'emailAddress must be a valid email address';
  }
  if (typeof password !== 'string' || !passwordPattern.test(password)) {
    return 'password must be at least 8 characters and contain at least 1 uppercase letter and 1 digit';
  }
  return null;
}

// Handelt login af en geeft een JWT terug bij geldige gegevens.
async function login(req, res, next) {
  try {
    const { emailAddress, password } = req.body;
    const invalidMessage = validationMessage(emailAddress, password);

    if (invalidMessage) {
      return res.status(400).json({
        status: 400,
        message: invalidMessage,
        data: null,
      });
    }

    const user = await authService.findUserByEmail(emailAddress);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid emailAddress or password',
        data: null,
      });
    }

    if (!config.jwt.secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { userId: user.id, emailAddress: user.emailAddress },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(200).json({
      status: 200,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddress: user.emailAddress,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
