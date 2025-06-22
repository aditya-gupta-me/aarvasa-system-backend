const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");
const redisClient = require("../config/redisClient");
const crypto = require('crypto');

router.get("/", async (req, res) => {
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


    const key = crypto
      .createHash("md5")
      .update(JSON.stringify(req.query))
      .digest("hex");

    const cachedData = await redisClient.get(key);
    if (cachedData) {
      console.log("🔁 Returned from Redis cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    let query = {};
    if (city) query.city = { $regex: city, $options: "i" };
    if (search) {
      query.$or = [
        { city: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { propertyTitle: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.propertyType = type;
    if (bedrooms) query.bedrooms = bedrooms;
    if (bathrooms) query.bathrooms = bathrooms;
    if (listingType) query.transactionType = listingType;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    await redisClient.setEx(key, 300, JSON.stringify(listings));

    console.log("✅ Fetched from MongoDB and cached");
    res.status(200).json(listings);

  } catch (error) {
    console.error("❌ Error fetching listings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});


// property details listing route

router.get("/:id", async(req, res) => {
  const { id } = req.params
  const data = await Listing.find({_id : id})
  res.json({status : true, data});
})

// 🔧 This line is essential
module.exports = router;
