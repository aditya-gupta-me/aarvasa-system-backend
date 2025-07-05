const Listing = require("../models/Listing");
const redisClient = require("../config/redisClient");
const crypto = require("crypto");
const axios = require("axios");
const Property = require("../models/Listing");

// Get all listings (with filters and Redis caching)
exports.getListings = async (req, res) => {
  try {
    const {
      city,
      propertyType,
      budget,
      transactionType
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
      query.propertyTitle = { $regex: city, $options: "i" };
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    // If budget is provided, filter listings with price <= budget
    if (budget) {
      query.price = { $lte: parseInt(budget) };
    }
    if(transactionType){
      query.transactionType = transactionType
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

exports.add = async (req, res) => {


  try {
    const response = await axios.get('https://www.magicbricks.com/mbsrp/propertySearch.html?editSearch=Y&category=S&bedrooms=11701,11702&city=5196&page=2&groupstart=30&offset=0&maxOffset=503&sortBy=premiumRecent&postedSince=-1&pType=10002,10003,10021,10022,10001,10017&isNRI=N&multiLang=en &propertyType=10017&keywords=premium,luxury');

    const data = response.data.resultList || [];

    const propertiesToSave = data.map(item => ({
      propertyTitle: item.propertyTitle,
      price: item.price,
      priceD: item.priceD,
      postedDate: new Date(item.postDateT),
      city: item.ctName,
      location: item.lmtDName,
      transactionType: item.transactionTypeD,
      propertyType: item.propTypeD,
      carpetArea: item.carpetArea || item.ca,
      carpetAreaUnit: 'Sq-ft',
      sqFtPrice: item.sqFtPrice,
      bedrooms: item.bedroomD,
      bathrooms: item.bathD,
      balconies: item.balconiesD,
      floor: item.floorD,
      flooringType: item.flooringTyD,
      furnished: item.furnishedD,
      ownershipType: item.ownershipTypeD,
      facing: item.facingD,
      amenFacing: item.amenFacingD,
      powerStatus: item.powerStatusD,
      waterStatus: item.waterStatus,
      parking: item.parkingD,
      bookingAmount: Number(item.bookingAmtExact || 0),
      maintenanceCharges: item.maintenanceCharges,
      maintenanceFreq: item.maintenanceD,
      possessionStatus: item.possStatusD,
      isPrimeLocation: item.isPrimeLocProp === 'Y',
      newConstruction: item.acD,
      imageUrls: item.allImgPath || [],
      thumbnailImages: item.propertyImageNew ? item.propertyImageNew.split(',') : [],
      coordinates: {
        lat: parseFloat(item.pmtLat) || 0,
        lng: parseFloat(item.pmtLong) || 0
      },
      detailedDescription: item.pmtUsp,
      shortDescription: item.pmtUspWap,
      agent: {},
      amenities: {},
      nearbyLandmarks: [],
      tenantPreference: item.tenantsPreference,
      reviews: []
    }));

    await Property.insertMany(propertiesToSave);

    res.status(200).json({ message: 'Properties saved successfully', count: propertiesToSave.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};


exports.returnRandom = async (req, res) => {
   try {
    const listings = await Listing.aggregate([{ $sample: { size: 5 } }]);
    res.json({listings, status : true});
  } catch (err) {
    console.error("Error in returnRandom:", err);
    res.status(500).json({ error: "Failed to fetch random listings" });
  }
}