const Listing = require("../models/Listing");
const redisClient = require("../config/redisClient");
const crypto = require("crypto");
const axios = require("axios");

// 📦 GET All Listings (with Redis + Filters)
exports.getListings = async (req, res) => {
  try {
    const { city, propertyType, budget, transactionType } = req.query;

    // Redis key based on filters
    const key = crypto
      .createHash("md5")
      .update(JSON.stringify(req.query))
      .digest("hex");

    const cachedData = await redisClient.get(key);
    if (cachedData) {
      console.log("🔁 Listings returned from Redis");
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Mongo query
    const query = {};

    if (city) {
      query.propertyTitle = { $regex: city, $options: "i" };
    }

    if (propertyType) query.propertyType = propertyType;
    if (transactionType) query.transactionType = transactionType;
    if (budget) query.price = { $lte: parseInt(budget) };

    const listings = await Listing.find(query).sort({ createdAt: -1 });

    // Cache it for 5 minutes
    await redisClient.setEx(key, 300, JSON.stringify(listings));

    console.log("✅ Listings fetched from Mongo and cached");
    return res.status(200).json(listings);
  } catch (err) {
    console.error("❌ Error in getListings:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 📦 GET Listing By ID (with Redis)
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const cached = await redisClient.get(id);
    if (cached) {
      console.log("📦 Detail returned from Redis");
      return res
        .status(200)
        .json({ status: true, data: JSON.parse(cached), msg: "From Redis" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    await redisClient.setEx(id, 300, JSON.stringify(listing));

    return res.status(200).json({ status: true, data: listing });
  } catch (err) {
    console.error("❌ Error in getListingById:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧪 GET Random Listings
exports.returnRandom = async (req, res) => {
  try {
    const listings = await Listing.aggregate([{ $sample: { size: 5 } }]);
    res.status(200).json({ listings, status: true });
  } catch (err) {
    console.error("❌ Error in returnRandom:", err);
    res.status(500).json({ error: "Failed to fetch random listings" });
  }
};

// 🌐 ADD via MagicBricks Scraper (for internal/testing)
exports.add = async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.magicbricks.com/mbsrp/propertySearch.html?editSearch=Y&category=S&bedrooms=11701,11702&city=5196&page=2&groupstart=30&offset=0&maxOffset=503&sortBy=premiumRecent&postedSince=-1&pType=10002,10003,10021,10022,10001,10017&isNRI=N&multiLang=en&propertyType=10017&keywords=premium,luxury"
    );

    const data = response.data.resultList || [];

    const propertiesToSave = data.map((item) => ({
      propertyTitle: item.propertyTitle,
      price: item.price,
      priceD: item.priceD,
      postedDate: new Date(item.postDateT),
      city: item.ctName,
      location: item.lmtDName,
      transactionType: item.transactionTypeD,
      propertyType: item.propTypeD,
      carpetArea: item.carpetArea || item.ca,
      carpetAreaUnit: "Sq-ft",
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
      isPrimeLocation: item.isPrimeLocProp === "Y",
      newConstruction: item.acD,
      imageUrls: item.allImgPath || [],
      thumbnailImages: item.propertyImageNew
        ? item.propertyImageNew.split(",")
        : [],
      coordinates: {
        lat: parseFloat(item.pmtLat) || 0,
        lng: parseFloat(item.pmtLong) || 0,
      },
      detailedDescription: item.pmtUsp,
      shortDescription: item.pmtUspWap,
      agent: {},
      amenities: {},
      nearbyLandmarks: [],
      tenantPreference: item.tenantsPreference,
      reviews: [],
    }));

    await Listing.insertMany(propertiesToSave);

    return res.status(200).json({
      message: "Properties saved successfully",
      count: propertiesToSave.length,
    });
  } catch (error) {
    console.error("❌ Scraping error:", error.message);
    res.status(500).json({ error: "Scraping failed" });
  }
};

exports.createListing = async (req, res) => {
  try {
    const body = req.body;
    console.log("📥 Incoming listing payload:", body);

    const uploadedImages = req.files?.length
      ? req.files.map((file) => file.path)
      : JSON.parse(body.photos || "[]");

    const {
      title,
      listingType,
      propertyCategory,
      location,
      coordinates,
      price,
      priceD,
      unit,
      bedrooms,
      bathrooms,
      balcony,
      facilities,
    } = body;

    const propertyTitle = title;

    const parsedLocation = {
      address: location,
    };

    const parsedCoordinates =
      typeof coordinates === "string" ? JSON.parse(coordinates) : coordinates;
    const parsedFacilities =
      typeof facilities === "string" ? JSON.parse(facilities) : facilities;

    const newProperty = new Listing({
      propertyTitle,
      price: Number(price),
      priceD,
      postedDate: new Date(),

      transactionType: listingType,
      propertyType: propertyCategory,
      location: parsedLocation?.address || "",
      city: parsedLocation?.address?.split(",")?.slice(-2)?.[0]?.trim() || "",

      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      balconies: Number(balcony),

      imageUrls: uploadedImages,
      thumbnailImages: uploadedImages,

      coordinates: {
        lat: parsedCoordinates?.lat || 0,
        lng: parsedCoordinates?.lng || 0,
      },

      amenities: {
        nonLuxury: Array.isArray(parsedFacilities) ? parsedFacilities : [],
      },

      shortDescription: propertyTitle,
      detailedDescription: `A beautiful ${propertyCategory} for ${listingType} located at ${parsedLocation?.address}`,
    });

    const saved = await newProperty.save();
    return res.status(201).json({ success: true, listing: saved });
  } catch (error) {
    console.error("❌ Error creating listing:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create listing" });
  }
};
