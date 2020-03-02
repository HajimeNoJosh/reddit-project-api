const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  amount: {
    type: Number
  },
  votes: {
    type: Number
  },
  upvoteUsers: {
    type: Array
  },
  downvoteUsers: {
    type: Array
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true}

})

module.exports = mongoose.model('Post', postSchema)
