const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const passportLocalMongoosePlugin = passportLocalMongoose.default || passportLocalMongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: { type: String, enum: ["customer", "consultant", "owner"], default: "customer", index: true },
    active: { type: Boolean, default: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" }
    // Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.
});

userSchema.plugin(passportLocalMongoosePlugin);

module.exports = mongoose.model('User', userSchema);
