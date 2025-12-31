require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const path = require("path");

const User = require("./models/user");

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* -------------------- DATABASE -------------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* -------------------- EMAIL SETUP -------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
    auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Nodemailer transporter is ready");
  }
});

/* -------------------- ROUTES -------------------- */
app.post("/register", async (req, res) => {
  try {
    const { username, email, dateOfBirth } = req.body;

    if (!username || !email || !dateOfBirth) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({ username, email, dateOfBirth });
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- CRON JOB -------------------- */
/*
  Runs every day at 7am (Africa/Accra)
  Change to "* * * * * or 0 7 * * * " temporarily for testing
*/
cron.schedule(
  "0 7 * * *",
  async () => {
    console.log("Running birthday check...");

    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      const users = await User.find({
        $expr: {
          $and: [
            { $eq: [{ $dayOfMonth: "$dateOfBirth" }, day] },
            { $eq: [{ $month: "$dateOfBirth" }, month] },
            { $ne: ["$lastEmailSentYear", year] },
          ],
        },
      });

      if (users.length === 0) {
        console.log("No birthdays today");
        return;
      }

      console.log(`Found ${users.length} birthday(s) today`);

      for (const user of users) {
        try {
          const mailOptions = {
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: `🎉 Happy Birthday, ${user.username}!`,
            html: `
              <h2>Happy Birthday, ${user.username}! 🎂</h2>
              <p>Wishing you a fantastic day filled with joy and happiness.</p>
              <p>From all of us at the team 💛</p>
            `,
          };

          await transporter.sendMail(mailOptions);

          user.lastEmailSentYear = year;
          await user.save();

          console.log(`Email sent to ${user.username} (${user.email})`);
        } catch (err) {
          console.error(`Failed to send email to ${user.email}:`, err);
        }
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Africa/Accra",
  }
);

/* -------------------- SERVER -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
