const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review.js');

const listingSchema = new Schema({
    title: {
        type: String, // Use 'String' with a capital 'S'
        required: true
    },
    description: String,
    image: {
        url: String,
        filename: String
    },
    price: {
        type: Number, // Ensure 'Number' type is correct
        required: true // Optionally make 'price' required
    },
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true // Optionally make 'owner' required
    },
    geometry: {
        type: {
            type: String, // 'type' for the GeoJSON specification
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    category: {
        type: String,
        required: true,
        enum: [
          "Trending",
          "Rooms",
          "Iconic Cities",
          "Mountains",
          "Castles",
          "Amazing-Pools",
          "Camping",
          "Farms",
          "Beach",
          "Others",
        ],
      },
    });
// Post middleware which will be executed after execution of findOneAndDelete
listingSchema.post('findOneAndDelete', async function (listing) {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
