const mongoose = require('mongoose');

const FallbackSchema = new mongoose.Schema({
    sentence: {
        type: String,
        required: true,
    },
    userID: {
        type: String,
        required: true,
    },
    guesses: {
        type: Array,
        default: []
    },
    create_At: {
        type: Date,
        default: Date.now()
    }
});

const Fallbacks = mongoose.model('Fallbacks', FallbackSchema);

module.exports = Fallbacks;