const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    chatId: {
      type: String,
    },
    senderId: {
      type: String,
    },
    text: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Message = mongoose.model('messages', messageSchema);
module.exports = Message;
