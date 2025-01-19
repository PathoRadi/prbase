const express = require('express');
const sendMail = require('../../utils/send-mail');
const router = express.Router();

// Example POST route for /contact
router.post("/", (req, res) => {
  const { firstname, lastname , email, subject, message } = req.body;

  const name = `${firstname} ${lastname}`;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const to = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
  sendMail(email, to, `${subject} from ${name}`, message)
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: 'Failed to send email' });
    });
});

module.exports = router;