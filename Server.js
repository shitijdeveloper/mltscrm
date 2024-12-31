const express = require('express');
const Chat = require('./Chat');
const Message = require('./Message');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8801; // Change to 8801 or any available port
app.post("/", async (req, res) => {
    const newChat = new Chat({
        members: [req.body.senderID, req.body.receiveId]
    });
    try {
        const result = await newChat.save();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET route to get all chats for a user
app.get("/:userId", async (req, res) => {
    try {
        const chat = await Chat.find({
            members: { $in: [req.params.userId] }
        });
        res.status(200).json(chat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET route to find a chat between two users
app.get("/find/:firstId/:secondId", async (req, res) => {
    try {
        const chat = await Chat.findOne({
            members: { $all: [req.params.firstId, req.params.secondId] }
        });
        res.status(200).json(chat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST route to add a message to a chat
app.post('/addmessage', async (req, res) => {
    const { chatId, senderId, text } = req.body;
    const message = new Message({
        chatId,
        senderId,
        text
    });
    try {
        const result = await message.save();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET route to get messages of a specific chat
app.get('/:chatId', async (req, res) => {
    const { chatId } = req.params;
    try {
        const result = await Message.find({ chatId });
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Socket.io for real-time communication
const io = require("socket.io")(8800, {
    cors: {
        origin: "http://localhost:3000",
    },
});

let activeUsers = [];

io.on("connection", (socket) => {
    socket.on("new-user-add", (newUserId) => {
        if (!activeUsers.some((user) => user.userId === newUserId)) {
            activeUsers.push({ userId: newUserId, socketId: socket.id });
            console.log("New User Connected", activeUsers);
        }
        io.emit("get-users", activeUsers);
    });

    socket.on("disconnect", () => {
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        console.log("User Disconnected", activeUsers);
        io.emit("get-users", activeUsers);
    });

    socket.on("send-message", (data) => {
        const { receiverId } = data;
        const user = activeUsers.find((user) => user.userId === receiverId);
        if (user) {
            io.to(user.socketId).emit("recieve-message", data);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
