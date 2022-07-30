var mongoose = require('mongoose');

var ConversationSchema = new mongoose.Schema({     
    userID: {
        type: String,
        required: true,
    },
    identify: {
        type: String,
        required: true,
    },
    historic: {
        type: Array,
        default : []
    },
    create_At: {
        type: Date,
        default : Date.now()
    }
});

var Conversations = mongoose.model('Conversations', ConversationSchema);

module.exports = Conversations;