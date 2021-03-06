const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  upvote: {
    type: Number
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upvoteUsers: {
    type: Array
  },
  downvoteUsers: {
    type: Array
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
})

module.exports = mongoose.model('Comment', commentSchema)
