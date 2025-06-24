const express = require("express");
const router = express.Router();
const { getListings, getListingById } = require("../controllers/listingController");

// GET /api/listings
router.get("/", getListings);

// GET /api/listings/:id
router.get("/:id", getListingById);

module.exports = router;
