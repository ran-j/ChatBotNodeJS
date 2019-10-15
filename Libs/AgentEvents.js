const fallbackLogs = require("../models/fallback");
const conversationLog = require("../models/conversationLogs");

const logFallback = (sentence, userID, guesses) => {
    new fallbackLogs({
        sentence,
        userID,
        guesses
    }).save()
        .then(() => {
            //Todo update dash board through soket IO
        }).catch((err) => {
            console.error(err)
        })
}

const logConversation = () => {

}

module.exports = {
    logFallback,
    logConversation
}