var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

var EndpointSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    userID: {
        type: String,
        required: true,
    },
    create_At: {
        type: Date,
        default: Date.now()
    }
});

var Endpoints = mongoose.model('Endpoints', EndpointSchema);

EndpointSchema.statics.createLog = function (userId, url, callback) {
    new Endpoints({
        userId,
        url
    }).save()
        .then((nModel) => callback(null, nModel))
        .catch((errr) => callback(errr, null))
}

module.exports = Endpoints;