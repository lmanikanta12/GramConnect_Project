const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html = null) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"GramConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || text,
  });
};

module.exports = sendEmail;