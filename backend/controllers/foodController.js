const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/mailer");
const users = require("../data/users.json");


/* ================= FILE HELPERS ================= */

const foodFile = path.join(__dirname, "../data/food.json");
const requestFile = path.join(__dirname, "../data/requests.json");

const readJSON = file =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];

const writeJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

const generateId = () => Date.now().toString();

/* ================= FOOD DONATIONS ================= */



exports.getFoodList = (req, res) => {
  res.json(readJSON(foodFile));
};

exports.approveFood = (req, res) => {
  const { id } = req.params;
  const foodList = readJSON(foodFile);

  const food = foodList.find(f => f.id === id);
  if (!food) return res.status(404).json({ message: "Food not found" });

  food.status = "Available";
  food.bookedBy = null;

  writeJSON(foodFile, foodList);
  res.json({ message: "Food approved & available" });
};

exports.bookFood = (req, res) => {
  const { id, bookedBy } = req.body;
  const foodList = readJSON(foodFile);

  const food = foodList.find(f => f.id === id);
  if (!food) return res.status(404).json({ message: "Food not found" });

  if (food.status !== "Available") {
    return res.status(400).json({ message: "Food already booked" });
  }

  food.status = "Booked";
  food.bookedBy = bookedBy;

  writeJSON(foodFile, foodList);
  res.json({ message: "Food booked successfully" });
};

/* ================= FOOD REQUESTS ================= */

exports.requestFood = (req, res) => {
  const { name, quantity, location, contact } = req.body;

  if (!name || !quantity || !location || !contact) {
    return res.status(400).json({ message: "All fields required" });
  }

  const requests = readJSON(requestFile);

  const request = {
    id: generateId(),
    name,
    quantity,
    location,
    contact,
    status: "Pending",
    donatedBy: null,
    donorContact: null,
    date: new Date()
  };

  requests.push(request);
  writeJSON(requestFile, requests);

  /* ✅ EMAIL TO DONORS */
  const donors = users.filter(u => u.role === "Donor");

  donors.forEach(donor => {
    sendEmail(
      donor.email,
      "🤝 New Food Request Available",
      `
        <h2>Food Request Alert</h2>
        <p><strong>Requester:</strong> ${request.name}</p>
        <p><strong>Quantity:</strong> ${request.quantity}</p>
        <p><strong>Location:</strong> ${request.location}</p>
        <p>Please login to FeedForward to donate.</p>
      `
    );
  });

  res.json({ message: "Food request sent for admin approval" });
};


exports.getRequests = (req, res) => {
  res.json(readJSON(requestFile));
};

exports.updateRequestStatus = (req, res) => {
  const { id, status } = req.body;
  const requests = readJSON(requestFile);

  const reqItem = requests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ message: "Request not found" });

  reqItem.status = status;
  writeJSON(requestFile, requests);

  res.json({ message: "Request status updated" });
};

exports.donateForRequest = (req, res) => {
  const { id, donorName, donorContact } = req.body;
  const requests = readJSON(requestFile);

  const reqItem = requests.find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (reqItem.status !== "Approved") {
    return res.status(400).json({ message: "Request already fulfilled" });
  }

  // Update request
  reqItem.status = "Fulfilled";
  reqItem.donatedBy = donorName;
  reqItem.donorContact = donorContact;
  reqItem.fulfilledDate = new Date();

  writeJSON(requestFile, requests);

  /* ✅ SEND EMAIL TO NGO */
  const ngo = users.find(u => u.role === "NGO");

  if (ngo) {
    sendEmail(
      ngo.email,
      "✅ Food Request Fulfilled",
      `
        <h2>Your Request Has Been Fulfilled</h2>
        <p><strong>Donor:</strong> ${donorName}</p>
        <p><strong>Contact:</strong> ${donorContact}</p>
        <p>Thank you for using FeedForward ❤️</p>
      `
    );
  }

  res.json({ message: "Food donated successfully" });
};


exports.addFood = (req, res) => {
  const { foodName, quantity, location, contact } = req.body;

  if (!foodName || !quantity || !location || !contact) {
    return res.status(400).json({ message: "All fields required" });
  }

  const foodList = readJSON(foodFile);

  const food = {
    id: generateId(),
    foodName,
    quantity,
    location,
    contact,
    status: "Pending",
    bookedBy: null,
    date: new Date()
  };

  foodList.push(food);
  writeJSON(foodFile, foodList);

  /* ✅ EMAIL TO NGOs */
  const ngos = users.filter(u => u.role === "NGO");

  ngos.forEach(ngo => {
    sendEmail(
      ngo.email,
      "🍱 New Food Donation Available",
      `
        <h2>New Food Donation</h2>
        <p><strong>Food:</strong> ${food.foodName}</p>
        <p><strong>Quantity:</strong> ${food.quantity}</p>
        <p><strong>Location:</strong> ${food.location}</p>
        <p>Login to FeedForward to accept this donation.</p>
      `
    );
  });

  res.json({ message: "Food added successfully" });
};
