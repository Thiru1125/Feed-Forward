const express = require("express");
const router = express.Router();

const {
  addFood,
  getFoodList,
  approveFood,
  bookFood,
  requestFood,
  getRequests,
  updateRequestStatus,
  donateForRequest
} = require("../controllers/foodController");

router.get("/", getFoodList);
router.post("/donate", addFood);
router.put("/approve/:id", approveFood);
router.put("/book", bookFood);

router.post("/request", requestFood);
router.get("/requests", getRequests);
router.put("/request-status", updateRequestStatus);
router.put("/donate-for-request", donateForRequest);

module.exports = router;

