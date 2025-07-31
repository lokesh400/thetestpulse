const mongoose = require('mongoose');

const forgetOtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpiration: {
        type: Date,
        required: true,
    },
});

// Create a TTL index on otpExpiration that expires after 5 minutes
forgetOtpSchema.index({ otpExpiration: 1 }, { expireAfterSeconds: 300 });

const forgetOtp = mongoose.model('forgetOtp', forgetOtpSchema);

module.exports = forgetOtp;
