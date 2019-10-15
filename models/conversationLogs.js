var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

var ConversationSchema = new mongoose.Schema({
    userSentence: {
        type: String,
        required: true,
    },
    userID: {
        type: String,
        required: true,
    },
    create_At: {
        type: Date,
        default : Date.now()
    }
});

var Conversations = mongoose.model('Conversations', ConversationSchema);

module.exports = Conversations;