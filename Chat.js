const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
  {
    members: {
      type: [String], 
    },
  },
  {
    timestamps: true, 
  }
);

const Chat = mongoose.model('chats', chatSchema);
module.exports = Chat;
