const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const favSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    propery_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listings",
            required: true
        }
    ]
})