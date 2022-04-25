require('dotenv').config();
module.exports = {
    'BotName': 'BotJs',
    'BotConfidence': { hight: 0.60, medium: 0.51, low: 0.25 },
    'DB': process.env.MONGODB_URI,
    'Language': 'en'
};