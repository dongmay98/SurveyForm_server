const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const mailer = require("../utils/mailer");

router.post("/submit-survey", (req, res) => {
  const { surveyData } = req.body;
  console.log(surveyData);
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userEmail = req.user.email;

  ejs.renderFile("views/surveyEmail.ejs", { surveyData }, (err, html) => {
    if (err) {
      console.log("Error rendering email template:", err);
      return res.status(500).json({ error: "Failed to render email template" });
    }

    mailer.sendMail(userEmail, "Survey Result", html, (error, info) => {
      if (error) {
        console.log("Error occurred:", error.message);
        return res.status(500).json({ error: "Failed to send email" });
      }
      console.log("Email sent:", info.response);
      res.json({ message: "Email sent successfully" });
    });
  });
});

module.exports = router;
