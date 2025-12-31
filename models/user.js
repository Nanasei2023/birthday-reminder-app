const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  lastEmailSentYear: {
    type: Number,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
