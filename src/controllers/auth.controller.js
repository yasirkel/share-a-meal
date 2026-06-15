const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const authService = require('../services/auth.service');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationMessage(emailAddress, password) {
  if (!emailAddress || !password) {
    return 'emailAddress and password are required';
  }
  if (typeof emailAddress !== 'string' || !emailPattern.test(emailAddress)) {
    return 'emailAddress must be a valid email address';
  }
  if (typeof password !== 'string' || password.length < 1) {
    return 'password must be a non-empty string';
  }
  return null;
}

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
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

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
