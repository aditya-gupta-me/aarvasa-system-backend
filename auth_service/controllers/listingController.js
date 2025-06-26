const Listing = require("../models/Listing");
const redisClient = require("../config/redisClient");
const crypto = require("crypto");

// Get all listings (with filters and Redis caching)
exports.getListings = async (req, res) => {
  try {
    const {
      city,
      propertyType,
      budget,
    } = req.query;

    // Create a unique Redis key based on query
    const key = crypto
      .createHash("md5")
      .update(JSON.stringify(req.query))
      .digest("hex");

    // Check Redis cache
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      console.log("🔁 Returned from Redis cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Build MongoDB query

    let query = {};

    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    // If budget is provided, filter listings with price <= budget
    if (budget) {
      query.price = { $lte: parseInt(budget) };
    }

    // Fetch from DB
    const listings = await Listing.find(query).sort({ createdAt: -1 });

    // Cache to Redis
    await redisClient.setEx(key, 300, JSON.stringify(listings));

    console.log("✅ Fetched from MongoDB and cached");
    res.status(200).json(listings);
  } catch (error) {
    console.error("❌ Error fetching listings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single listing by ID
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const cached = await redisClient.get(id);
    if (cached) {
      console.log("details from redis");
      return res.json({ status: true, data: JSON.parse(cached), msg: "redis" });
    }
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    redisClient.setEx(id, 300, JSON.stringify(listing));
    return res.json({ status: true, data: listing });
  } catch (error) {
    console.error("❌ Error fetching listing by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
