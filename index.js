const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const app = express();
const User = require('./User')
const jwtKey = process.env.JWT_SECRET_KEY || 'default_jwt_secret';
const multer = require('multer');
const path = require('path');
const Customer = require('./Custmoer'); 
const Port = process.env.PORT || 10000;
const server=require('./Server')
const session=require('express-session')
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Ensure 'favicon.ico' is in the 'public' folder
mongoose.connect('mongodb://127.0.0.1:27017/CRM')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error.message));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if you're using HTTPS
    maxAge: 60000, // 1 minute
  }
}));
  
  app.get('/text', (req, res) => {
    if (req.session.test) {
      req.session.test++;
    } else {
      req.session.test = 1;
    }
    res.send(`Session count: ${req.session.test}`);
  });
  app.get("/hii", (req, res) => {
    console.log("Hii");
    res.status(200).send("Hello from the backend!");
  });
  app.get('/lead',async(req,res)=>{
    try {
       const Reuslt= await Customer.find();
       if (Reuslt) {
        res.status(200).json(Reuslt)
       } else {
        res.status(400).json({message : "Not fetch Lead "})
       }
     
    } catch (error) {
      console.error(error)
      res.status(500).json({message : "Server Error Please Wait"})
    }
  })
app.use("/images", express.static(path.join(__dirname, "public/images")));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});
const uploadProfileImage = multer({ storage }).single("file");
app.post("/upload-profile-image", uploadProfileImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const userId = req.body.userId; 
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImg: req.file.filename },
      { new: true }
    );

    res.status(200).json({
      message: "Profile image uploaded successfully!",
      profileImgUrl: `http://localhost:10000/images/${req.file.filename}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading profile image: " + error.message });
  }
});

app.post('/customer', async (req, res) => {
  try {
    const { name, email, mobileno, healthCondition, city, state, address, Zipcode } = req.body; 
    const createby = req.user?._id; // Assuming you're passing the user info with the token in the request
    const newCustomer = new Customer({
      name,
      email,
      mobileno,
      healthCondition,
      city,
      state,
      address,
      Zipcode,
      createby
    });

    await newCustomer.save();
    res.status(201).json({ message: "Customer created successfully!", data: newCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
});
app.put('/lead/:id', async (req, res) => {
  const { id } = req.params;
  const { status, action } = req.body;  // Include action to handle 'cancel' or 'accept'

  try {
    let updateData = { status };
    if (action === 'cancel') {
      updateData = { ...updateData, canceled: true };  // Set canceled flag if action is cancel
    }

    const lead = await Customer.findByIdAndUpdate(id, updateData, { new: true });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.status(200).json({ message: 'Lead status updated successfully!', data: lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating lead status' });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, mobileno, password, role = 'user' } = req.body;
    if (!name || !email || !mobileno || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, mobileno, password: hashedPassword, role });
    await newUser.save();
    res.status(200).json({ message: "Registration is successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error. Please try again later" });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request received:", email); // Log incoming request data
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token with role and user id
    const token = jwt.sign({ userId: user._id, role: user.role }, jwtKey, { expiresIn: '3h' });
    res.status(200).json({ message: "Successfully logged in", token, user });
  } catch (error) {
    console.log("Error during login:", error);  // Log any errors
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from the authorization header
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  try {
    req.user = jwt.verify(token, jwtKey); // Verify the token and attach user info to req.user
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required permissions' });
    }
    next();
  };
};
app.get('/admin-dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome to the admin dashboard' });
});
app.get('/user-dashboard', authenticateToken, authorizeRole('user'), (req, res) => {
  res.status(200).json({ message: 'Welcome to the user dashboard' });
});
app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: `Welcome to the dashboard, ${user.name}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Please try again later" });
  }
});
app.get('/users', async (req, res) => {
  try {
    const users = await User.find(); // Assuming User is your MongoDB model
    res.status(200).json(users); // Send the users array as the response
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
});
app.get('/user/:id', async (req, res) => {
  try {
    const result = await User.findById(req.params.id);
    if (result) {
      res.status(200).json({ message: "User found", data: result });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server issue, please try again later" });
  }
});
app.delete('/users/:id', async (req, res) => {
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'User successfully deleted.' });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

app.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, mobileno, password, role = 'user' } = req.body;
  try {
    const result = await User.findByIdAndUpdate(
      id,
      { name, email, mobileno, password, role },
      { new: true }
    );
    if (result) {
      res.status(200).json({ message: "User successfully updated", data: result });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});
app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});
