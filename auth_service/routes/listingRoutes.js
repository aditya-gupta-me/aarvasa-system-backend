const express = require("express");
const router = express.Router();
const { getListings, getListingById, add, returnRandom } = require("../controllers/listingController");

// GET /api/listings
router.get("/", getListings);

// GET /api/listings/:id
router.get("/add", add)
router.get("/random", returnRandom);
router.get("/:id", getListingById);


module.exports = router;
