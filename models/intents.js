const mongoose = require('mongoose');

const IntentsSchema = new mongoose.Schema({
  tag: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  patterns: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  responses: {
    type: Array,
    required: true,
  },
  context_set: {
    type: String,
  },
  context_filter: {
    type: String,
  }
});

const Intents = mongoose.model('IntentsSchema', IntentsSchema);

module.exports = Intents;