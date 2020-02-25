const mongoose = require('mongoose')

const downvoteSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
},
{
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true}

})

module.exports = mongoose.model('Downvote', downvoteSchema)
