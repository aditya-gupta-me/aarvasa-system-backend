const express = require("express");
const router = express.Router();
const { 
  getListings, 
  getListingById, 
  add, 
  returnRandom 
} = require("../controllers/listingController");

// Define specific routes first
router.get("/add", add);
router.get("/random", returnRandom);

// General listing
router.get("/", getListings);

// This should be last to prevent conflicts
router.get("/:id", getListingById);

module.exports = router;
