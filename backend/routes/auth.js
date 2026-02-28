import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import DCStudent from "../models/DCStudent.js";
import JCStudent from "../models/JCStudent.js";
import DCTeacher from "../models/DCTeacher.js";
import JCTeacher from "../models/JCTeacher.js";

const router = express.Router();

/* ===================================================
   REGISTER (ADMIN ONLY)
=================================================== */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || role !== "admin") {
      return res.status(400).json({
        message: "Only admins can register via this endpoint"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const adminCount = await User.countDocuments({ role: "admin" });
    const token = req.headers.authorization?.split(" ")[1];

    // If not first admin, require authentication
    if (adminCount > 0) {
      if (!token) {
        return res.status(403).json({ message: "Admin authentication required" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const adminUser = await User.findById(decoded.userId);

      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create admin accounts" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin"
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});


/* ===================================================
   ADMIN CREATE USER (STUDENTS / TEACHERS ONLY)
=================================================== */
router.post("/create-user", async (req, res) => {
  try {
    console.log('User creation request received');
    console.log('Request body:', req.body);
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.userId);

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create users" });
    }

    const { fullName, email, password, role, college, degree, year, semester } = req.body;

    console.log('Parsed user data:', { fullName, email, role, college, degree, year, semester });

    if (!fullName || !email || !password || !role || !college || (role === "student" && !year)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (role === "student" && college === "Degree College" && !semester) {
      return res.status(400).json({ message: "Semester is required for Degree College students" });
    }

    if (role !== "student" && role !== "teacher") {
      return res.status(400).json({
        message: "Invalid role. Use /register for admin accounts."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let UserModel;

    if (role === "student") {
      UserModel =
        college === "Degree College" ? DCStudent :
        college === "Junior College" ? JCStudent :
        null;
    }

    if (role === "teacher") {
      UserModel =
        college === "Degree College" ? DCTeacher :
        college === "Junior College" ? JCTeacher :
        null;
    }

    if (!UserModel) {
      return res.status(400).json({ message: "Invalid college selection" });
    }

    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate class name for students
    let className = "";
    if (role === "student") {
      if (college === "Degree College") {
        const degreeMappings = {
          'B.Sc (CS)': 'BScCS',
          'BMS': 'BMS',
          'BCom': 'BCom',
          'BAF': 'BAF'
        };
        const degreeCode = degreeMappings[degree];
        if (degreeCode) {
          className = `${year}${degreeCode}`;
        }
      } else if (college === "Junior College") {
        className = `${year}JC`;
      }
    }

    console.log('Generated class name:', className);

    const newUser = new UserModel({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      college,
      stream: role === "student" && college === "Junior College" ? degree : undefined,
      degree: role === "student" && college === "Degree College" ? degree : undefined,
      year: role === "student" ? year : undefined,
      semester: role === "student" && college === "Degree College" ? semester : undefined,
      class: role === "student" ? className : undefined,
      course: role === "teacher" ? degree : undefined,
      subject: role === "teacher" ? degree : undefined
    });

    console.log('Creating user with data:', {
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      college: newUser.college,
      class: newUser.class,
      degree: newUser.degree,
      year: newUser.year,
      semester: newUser.semester
    });

    await newUser.save();
    console.log('User created successfully');

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        college: newUser.college,
        degree: newUser.degree,
        stream: newUser.stream,
        course: newUser.course,
        subject: newUser.subject
      }
    });

  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error during user creation" });
  }
});


/* ===================================================
   LOGIN
=================================================== */
router.post("/login", async (req, res) => {
  try {
    console.log('Login request received');
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);

    const normalizedEmail = email.trim().toLowerCase();

    const collections = [
      { model: User, type: "admin" },
      { model: DCStudent, type: "DCStudent" },
      { model: JCStudent, type: "JCStudent" },
      { model: DCTeacher, type: "DCTeacher" },
      { model: JCTeacher, type: "JCTeacher" }
    ];

    let user = null;
    let userType = null;

    console.log('Searching for user in collections...');
    for (const c of collections) {
      try {
        console.log(`Checking ${c.type} collection...`);
        const found = await c.model.findOne({ email: normalizedEmail });
        if (found) {
          user = found;
          userType = c.type;
          console.log(`Found user in ${c.type}:`, found.fullName);
          break;
        }
      } catch (error) {
        console.error(`Error searching ${c.type}:`, error);
      }
    }

    if (!user) {
      console.log('User not found in any collection');
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('Comparing password...');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Password comparison failed');
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('Password valid, updating lastLogin...');
    try {
      user.lastLogin = new Date();
      await user.save();
      console.log('lastLogin updated successfully');
    } catch (saveError) {
      console.error('Error updating lastLogin:', saveError);
      // Continue even if lastLogin update fails
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, userType },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log('Login successful for:', user.fullName, 'as', userType);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        college: user.college,
        degree: user.degree,
        stream: user.stream,
        year: user.year,
        semester: user.semester,
        userType
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});


/* ===================================================
   VERIFY TOKEN
=================================================== */
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const collections = [
      { model: User, type: "admin" },
      { model: DCStudent, type: "DCStudent" },
      { model: JCStudent, type: "JCStudent" },
      { model: DCTeacher, type: "DCTeacher" },
      { model: JCTeacher, type: "JCTeacher" }
    ];

    let user = null;

    if (decoded.userType) {
      const match = collections.find((c) => c.type === decoded.userType);
      if (match) {
        user = await match.model.findById(decoded.userId).select("-password");
      }
    }

    if (!user) {
      for (const c of collections) {
        const found = await c.model.findById(decoded.userId).select("-password");
        if (found) {
          user = found;
          break;
        }
      }
    }

    if (!user) return res.status(401).json({ message: "Invalid token" });

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
});

export default router;