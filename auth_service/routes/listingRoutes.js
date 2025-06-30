const express = require("express");
const router = express.Router();
const { getListings, getListingById, add } = require("../controllers/listingController");

// GET /api/listings
router.get("/", getListings);

// GET /api/listings/:id
router.get("/:id", getListingById);
router.get("/add", add)

module.exports = router;
