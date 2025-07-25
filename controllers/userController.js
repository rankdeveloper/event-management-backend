const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(req.body);

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("Password received:", password);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Request body:", { email, password });

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.secret_key_jwt,
      { expiresIn: "1h" }
    );
    console.log("Generated token:", token);

    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    // res.status(500).json({ message: "Internal server error" });
  }
};

const enterMe = async (req, res, next) => {
  console.log("enterMe called", req);
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        pic: user.pic,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: "Logged out successfully" });
};

const updateUser = async (req, res) => {
  try {
    const { username } = req.body;
    const imageFile = req.file;
    console.log("req", req);
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let uploadedImageUrl = null;

    if (imageFile) {
      uploadedImageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.unsigned_upload_stream(
          "events",
          {},
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(imageFile.buffer).pipe(stream);
      });
    }

    user.username = username;
    user.pic = uploadedImageUrl;
    console.log("uploadedImageUrl", uploadedImageUrl);
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        pic: user.pic,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const guestSignIn = async (req, res) => {
  try {
    const guestUser = await User.create({
      isGuest: true,
      username: "Guest",
      email: "guest@gmail.com",
    });
    const token = jwt.sign(
      {
        id: guestUser._id,
        username: guestUser.username,
        isGuest: guestUser.isGuest,
      },
      process.env.secret_key_jwt,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Failed to login as Guest" });
  }
};

module.exports = {
  register,
  login,
  enterMe,
  logout,
  updateUser,
  guestSignIn,
};
