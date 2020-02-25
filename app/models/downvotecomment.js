const mongoose = require('mongoose')

const downvotecommentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }
},
{
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true}

})

module.exports = mongoose.model('Downvotecomment', downvotecommentSchema)
