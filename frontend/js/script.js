const BASE_URL = "http://localhost:3000/api";

/* ================= HELPER ================= */
function getVal(id) {
  return document.getElementById(id)?.value.trim();
}

/* ================= POPUP ================= */
function showPopup(type, title, message) {
  const popup = document.getElementById("popup");
  if (!popup) {
    alert(message);
    return;
  }

  popup.style.display = "flex";
  document.getElementById("popupTitle").innerText = title;
  document.getElementById("popupMessage").innerText = message;
  document.getElementById("popupIcon").innerText =
    type === "success" ? "✔" : type === "error" ? "✖" : "ℹ";
}

function closePopup() {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
}

/* ================= DONATE FOOD ================= */
function donateFood(e) {
  e.preventDefault();

  const foodName = getVal("foodName");
  const quantity = getVal("quantity");
  const location = getVal("location");
  const contact = getVal("contact");

  if (!foodName || !quantity || !location || !contact) {
    showPopup("error", "Missing Fields", "All fields are required");
    return;
  }

  fetch(`${BASE_URL}/food/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodName, quantity, location, contact })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      showPopup("success", "Submitted", data.message);
      e.target.reset();
    })
    .catch(() => {
      showPopup("error", "Error", "Something went wrong");
    });
}

/* ================= REQUEST FOOD ================= */
function requestFood(e) {
  e.preventDefault();

  const name = getVal("name");
  const quantity = getVal("quantity");
  const location = getVal("location");
  const contact = getVal("contact");

  if (!name || !quantity || !location || !contact) {
    showPopup("error", "Missing Fields", "All fields are required");
    return;
  }

  fetch(`${BASE_URL}/food/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, quantity, location, contact })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      showPopup("success", "Request Sent", data.message);
      e.target.reset();
    })
    .catch(() => {
      showPopup("error", "Error", "Request failed");
    });
}

/* ================= USER FOOD LIST ================= */
function loadFoodList() {
  const container = document.getElementById("foodList");
  if (!container) return;

  fetch(`${BASE_URL}/food`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      data.forEach(food => {

        /* 🔹 AVAILABLE FOOD */
        if (food.status === "Available") {
          container.innerHTML += `
            <div class="food-card">
              <h3>${food.foodName}</h3>

              <div class="pill-row">
                <span class="pill">Qty: ${food.quantity}</span>
                <span class="pill">📍 ${food.location}</span>
              </div>

              <button class="action-btn"
                onclick="bookFood('${food.id}')">
                📌 Accept Food
              </button>
            </div>
          `;
        }

        /* 🔹 BOOKED FOOD */
        if (food.status === "Booked") {
          container.innerHTML += `
            <div class="food-card booked">
              <h3>${food.foodName}</h3>

              <span class="status-booked">
                📌 Booked by ${food.bookedBy}
              </span>
            </div>
          `;
        }

      });
    });
}


function bookFood(id) {
  const user = JSON.parse(localStorage.getItem("userProfile"));
  if (!user) {
    alert("Login required");
    return;
  }

  fetch(`${BASE_URL}/food/book`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, bookedBy: user.name })
  })
    .then(res => res.json())
    .then(data => {
      showPopup("success", "Booked", data.message);
      loadFoodList();
    });
}

/* ================= ADMIN FOOD ================= */
function loadAdminFood() {
  const container = document.getElementById("adminFoodList");
  if (!container) return;

  fetch(`${BASE_URL}/food`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("pendingCount").innerText =
        data.filter(f => f.status === "Pending").length;

      document.getElementById("approvedCount").innerText =
        data.filter(f => f.status === "Available").length;

      document.getElementById("bookedCount").innerText =
        data.filter(f => f.status === "Booked").length;

      container.innerHTML = "";

      data.forEach(food => {
        container.innerHTML += `
          <div class="admin-food-card">
            <h3>${food.foodName}</h3>

            <div class="status-line">
              Status:
              <span class="status-text ${food.status.toLowerCase()}">
                ${food.status}
              </span>
            </div>

            ${
              food.status === "Pending"
                ? `
                  <div class="action-buttons">
                    <button class="btn-approve" onclick="approveFood('${food.id}')">
                      ✔ Approve
                    </button>
                    <button class="btn-reject" onclick="rejectFood('${food.id}')">
                      ✖ Reject
                    </button>
                  </div>
                `
                : food.status === "Booked"
                ? `
                  <div class="status-badge booked">
                    📌 Booked by ${food.bookedBy}
                  </div>
                `
                : `
                  <div class="status-badge approved">
                    ✔ Approved
                  </div>
                `
            }
          </div>
        `;
      });
    })
    .catch(err => console.error("Error loading admin food:", err));
}

function approveFood(id) {
  fetch(`${BASE_URL}/food/approve/${id}`, { method: "PUT" })
    .then(() => loadAdminFood());
}

function rejectFood(id) {
  fetch(`${BASE_URL}/food/request-status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status: "Rejected" })
  }).then(() => loadAdminFood());
}

/* ================= ADMIN REQUESTS ================= */
function loadFoodRequests() {
  const container = document.getElementById("adminRequestList");
  if (!container) return;

  fetch(`${BASE_URL}/food/requests`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      if (data.length === 0) {
        container.innerHTML = "<p>No food requests found</p>";
        return;
      }

      data.forEach(req => {
        container.innerHTML += `
          <div class="admin-food-card">
            <h3>${req.name}</h3>
            <p>Quantity: ${req.quantity}</p>
            <p>Location: ${req.location}</p>

            <div class="status-line">
              Status:
              <span class="status-text ${req.status.toLowerCase()}">
                ${req.status}
              </span>
            </div>

            ${
              req.status === "Pending"
                ? `
                  <div class="action-buttons">
                    <button class="btn-approve"
                      onclick="updateRequest('${req.id}','Approved')">
                      ✔ Approve
                    </button>

                    <button class="btn-reject"
                      onclick="updateRequest('${req.id}','Rejected')">
                      ✖ Reject
                    </button>
                  </div>
                `
                : `
                  <div class="status-badge approved">
                    ✔ ${req.status}
                  </div>
                `
            }
          </div>
        `;
      });
    });
}


function updateRequest(id, status) {
  fetch(`${BASE_URL}/food/request-status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status })
  }).then(() => loadFoodRequests());
}

/* ================= AVAILABLE REQUESTS ================= */
function loadAvailableRequests() {
  const container = document.getElementById("availableRequests");
  if (!container) return;

  fetch(`${BASE_URL}/food/requests`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      data.forEach(req => {

        /* 🔹 APPROVED REQUESTS */
        if (req.status === "Approved") {
          container.innerHTML += `
            <div class="request-card">
              <h3>${req.name}</h3>

              <div class="pill-row">
                <span class="pill">Qty: ${req.quantity}</span>
                <span class="pill">📍 ${req.location}</span>
              </div>

              <button class="action-btn"
                onclick="donateForRequest('${req.id}')">
                🤝 Donate
              </button>
            </div>
          `;
        }

        /* 🔹 FULFILLED REQUESTS */
        if (req.status === "Fulfilled") {
          container.innerHTML += `
            <div class="request-card fulfilled">
              <h3>${req.name}</h3>

              <div class="pill-row">
                <span class="pill">Qty: ${req.quantity}</span>
                <span class="pill">📍 ${req.location}</span>
              </div>

              <div class="info-box">
                <p><strong>Donor:</strong> ${req.donorName || req.donatedBy || "Not Available"}</p>
                <p><strong>Contact:</strong> ${req.donorContact || "Not Available"}</p>
              </div>

              <div class="status-success">✔ Donation Completed</div>
            </div>
          `;
        }

      });
    })
    .catch(err => {
      console.error("Error loading requests:", err);
    });
}


function donateForRequest(id) {
  const donor = JSON.parse(localStorage.getItem("userProfile"));

  if (!donor) {
    alert("Login required to donate");
    return;
  }

  /* ✅ Ensure donor name is ALWAYS present */
  let donorName = donor.name;
  if (!donorName || donorName.trim() === "") {
    donorName = prompt("Enter your name");
  }

  const donorContact = prompt("Enter your contact number");

  if (!donorName || !donorContact) {
    alert("Donor name and contact are required");
    return;
  }

  fetch(`${BASE_URL}/food/donate-for-request`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      donorName,
      donorContact
    })
  })
    .then(res => res.json())
    .then(data => {
      showPopup("success", "Thank You", data.message);
      loadAvailableRequests();
    })
    .catch(err => {
      console.error(err);
      showPopup("error", "Error", "Donation failed");
    });
}

/* ================= REGISTER ================= */
function registerUser(e) {
  e.preventDefault();

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const role = document.getElementById("role")?.value;
  const adminSecret = document.getElementById("adminSecret")?.value;

  if (!name || !email || !password || !role) {
    showPopup("error", "Missing Fields", "All fields are required");
    return;
  }

  fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      role,
      adminSecret
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message === "Registration successful") {
        showPopup("success", "Success", data.message);

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } else {
        showPopup("error", "Error", data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showPopup("error", "Error", "Registration failed");
    });
}



/* ================= AUTH ================= */
function loginUser(e) {
  e.preventDefault();

  const email = getVal("loginEmail");
  const password = getVal("loginPassword");

  fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      localStorage.setItem("userProfile", JSON.stringify(data));
      showPopup("success", "Welcome", "Login successful");

      setTimeout(() => {
        window.location.href =
          data.role === "Admin" ? "admin.html" : "index.html";
      }, 1000);
    })
    .catch(() => {
      showPopup("error", "Login Failed", "Invalid credentials");
    });
}

function logoutAdmin() {
  localStorage.clear();
  window.location.href = "login.html";
}
