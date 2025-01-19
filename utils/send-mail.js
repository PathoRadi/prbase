const nodemailer = require('nodemailer');

/**
 * Sends an email to the specified recipient (typically a contact form submission).
 * @param {string} from - The email address sending the message
 * @param {string} to - The email address receiving the message
 * @param {string} subject - The subject of the email
 * @param {string} message - The body content of the email
 * @returns {boolean} - Returns true if the email was sent successfully, otherwise false
 */
const sendMail = async (from, to, subject, message) => {
  try {
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: message,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
};

module.exports = sendMail;
