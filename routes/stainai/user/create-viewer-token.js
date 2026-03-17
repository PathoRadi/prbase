const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userid, email, firstname, lastname } = req.body;

    if (!userid || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required user info',
      });
    }

    const token = jwt.sign(
      {
        userid,
        email,
        firstname: firstname || '',
        lastname: lastname || '',
        purpose: 'viewer-bridge',
      },
      process.env.SSO_SHARED_SECRET,
      {
        expiresIn: '15m',
      }
    );

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error creating viewer token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create viewer token',
    });
  }
});

module.exports = router;