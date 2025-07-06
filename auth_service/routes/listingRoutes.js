const express = require("express");
const router = express.Router();
const {
  getListings,
  getListingById,
  createListing,
  add,
  returnRandom,
} = require("../controllers/listingController");

const upload = require("../middlewares/cloudinaryUpload");

// Define specific routes first
router.get("/add", add);
router.get("/random", returnRandom);

// POST route for creating listings
// Upload multiple photos with field name 'photos'
router.post("/create", upload.array("photos", 10), createListing);

// General listing fetch
router.get("/", getListings);

// Get listing by ID — keep at bottom
router.get("/:id", getListingById);

module.exports = router;
