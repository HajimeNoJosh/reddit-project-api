// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for downvotes
const Downvote = require('../models/downvote')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { downvote: { title: '', text: 'foo' } } -> { downvote: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /downvotes
router.get('/downvotes', (req, res, next) => {
  if (req.query.post) {
    Downvote.find({post_id: req.query.post})
      .then(downvotes => {
        return downvotes.map(downvote => downvote.toObject())
      })
      .then(downvotes => res.status(200).json({downvotes: downvotes, post: req.query.post}))
      .catch(next)
  } else {
    Downvote.find()
      .then(downvotes => {
        return downvotes.map(downvote => downvote.toObject())
      })
      .then(downvotes => res.status(200).json({ downvotes: downvotes }))
      // if an error occurs, pass it to the handler
      .catch(next)
  }
})

// SHOW
// GET /downvotes/5a7db6c74d55bc51bdf39793
router.get('/downvotes/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Downvote.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "downvote" JSON
    .then(downvote => res.status(200).json({ downvote: downvote.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /downvotes
router.post('/downvotes', requireToken, (req, res, next) => {
  // set owner of new downvote to be current user
  req.body.downvote.owner = req.user.id
  Downvote.find({owner: req.user.id, post_id: req.body.downvote.post_id})
    .then(downvotes => {
      if (downvotes.length > 0) {
        res.status(400).json({errors: 'You can only downvote once!'})
      } else {
        Downvote.create(req.body.downvote)
        // respond to succesful `create` with status 201 and JSON of new "downvote"
          .then(downvote => {
            res.status(201).json({ downvote: downvote.toObject() })
          })
        // if an error occurs, pass it off to our error handler
        // the error handler needs the error message and the `res` object so that it
        // can send an error message back to the client
          .catch(next)
      }
    })
})

// UPDATE
// PATCH /downvotes/5a7db6c74d55bc51bdf39793
router.patch('/downvotes/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.downvote.owner

  Downvote.findById(req.params.id)
    .then(handle404)
    .then(downvote => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, downvote)

      // pass the result of Mongoose's `.update` to the next `.then`
      return downvote.updateOne(req.body.downvote)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /downvotes/5a7db6c74d55bc51bdf39793
router.delete('/downvotes/:id', requireToken, (req, res, next) => {
  Downvote.findById(req.params.id)
    .then(handle404)
    .then(downvote => {
      // throw an error if current user doesn't own `downvote`
      requireOwnership(req, downvote)
      // delete the downvote ONLY IF the above didn't throw
      downvote.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
