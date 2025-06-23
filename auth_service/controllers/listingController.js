const Listing = require("../models/Listing");
const redisClient = require("../config/redisClient");
const crypto = require("crypto");

// Get all listings (with filters and Redis caching)
exports.getListings = async (req, res) => {
  try {
    const {
      city,
      type,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      listingType,
      search,
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
    if (city) query.city = { $regex: city, $options: "i" };
    if (type) query.propertyType = type;
    if (bedrooms) query.bedrooms = bedrooms;
    if (bathrooms) query.bathrooms = bathrooms;
    if (listingType) query.transactionType = listingType;
    if (search) {
      query.$or = [
        { city: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { propertyTitle: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
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

    const listing = await Listing.find({ _id: id });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({ status: true, data: listing });
  } catch (error) {
    console.error("❌ Error fetching listing by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
