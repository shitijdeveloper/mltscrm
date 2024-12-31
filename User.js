const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobileno: { type: Number, required: true }, 
  password: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  role: { type: String, default: "user" },
  profileImg: { type: String, default: null }
});

const User = mongoose.model('users', UserSchema);
module.exports = User;
