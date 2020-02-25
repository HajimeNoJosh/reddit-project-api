// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for downvotecomments
const Downvotecomment = require('../models/downvotecomment')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { downvotecomment: { title: '', text: 'foo' } } -> { downvotecomment: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /downvotecommentsy
router.get('/downvotecomments', (req, res, next) => {
  if (req.query.comment) {
    Downvotecomment.find({comment_id: req.query.comment})
      .then(downvotecomments => {
        console.log(downvotecomments, 'downvotecomments')
        return downvotecomments.map(downvotecomment => downvotecomment.toObject())
      })
      .then(downvotecomments => res.status(200).json({downvotecomments: downvotecomments, comment: req.query.comment}))
      .catch(next)
  } else {
    Downvotecomment.find()
      .then(downvotecomments => {
        return downvotecomments.map(downvotecomment => downvotecomment.toObject())
      })
      .then(downvotecomments => res.status(200).json({ downvotecomments: downvotecomments }))
      // if an error occurs, pass it to the handler
      .catch(next)
  }
})

// SHOW
// GET /downvotecomments/5a7db6c74d55bc51bdf39793
router.get('/downvotecomments/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Downvotecomment.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "downvotecomment" JSON
    .then(downvotecomment => res.status(200).json({ downvotecomment: downvotecomment.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /downvotecomments
router.post('/downvotecomments', requireToken, (req, res, next) => {
  // set owner of new downvotecomment to be current user
  req.body.downvotecomment.owner = req.user.id
  Downvotecomment.find({owner: req.user.id, comment_id: req.body.downvotecomment.comment_id})
    .then(downvotecomments => {
      if (downvotecomments.length > 0) {
        res.status(400).json({errors: 'You can only downvotecomment once!'})
      } else {
        Downvotecomment.create(req.body.downvotecomment)
        // respond to succesful `create` with status 201 and JSON of new "downvotecomment"
          .then(downvotecomment => {
            res.status(201).json({ downvotecomment: downvotecomment.toObject() })
          })
        // if an error occurs, pass it off to our error handler
        // the error handler needs the error message and the `res` object so that it
        // can send an error message back to the client
          .catch(next)
      }
    })
})

// UPDATE
// PATCH /downvotecomments/5a7db6c74d55bc51bdf39793
router.patch('/downvotecomments/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.downvotecomment.owner

  Downvotecomment.findById(req.params.id)
    .then(handle404)
    .then(downvotecomment => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, downvotecomment)

      // pass the result of Mongoose's `.update` to the next `.then`
      return downvotecomment.updateOne(req.body.downvotecomment)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /downvotecomments/5a7db6c74d55bc51bdf39793
router.delete('/downvotecomments/:id', requireToken, (req, res, next) => {
  Downvotecomment.findById(req.params.id)
    .then(handle404)
    .then(downvotecomment => {
      // throw an error if current user doesn't own `downvotecomment`
      requireOwnership(req, downvotecomment)
      // delete the downvotecomment ONLY IF the above didn't throw
      downvotecomment.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
