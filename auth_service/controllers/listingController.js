// controllers/listingController.js

const Listing = require('../models/Listing'); // Mongoose Model

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
    } = req.query;

    // Build dynamic query
    let query = {};

    if (city) query.city = { $regex: city, $options: 'i' };
    if (type) query.propertyType = type;
    if (bedrooms) query.bedrooms = bedrooms;
    if (bathrooms) query.bathrooms = bathrooms;
    if (listingType) query.transactionType = listingType;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    const listings = await Listing.find(query).sort({ postedDate: -1 });

    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
