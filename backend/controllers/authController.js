const ADMIN_SECRET = "Thiru1234"; 


const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "../data/users.json");

const readUsers = () => {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
};

const writeUsers = (data) => {
  fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));
};

/* REGISTER */
exports.registerUser = (req, res) => {
  const { name, email, password, role, adminSecret } = req.body;

  const users = readUsers();

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // 🔐 ADMIN SECURITY CHECK
  if (role === "Admin") {
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return res.status(403).json({
        message: "Invalid Admin Secret Password"
      });
    }
  }

  users.push({ name, email, password, role });
  writeUsers(users);

  res.json({ message: "Registration successful" });
};


exports.login = (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password.trim();

  const users = readUsers();

  const user = users.find(
    u => u.email.toLowerCase() === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  res.json({
    message: "Login successful",
    role: user.role,
    name: user.name,
    email: user.email
  });
};
