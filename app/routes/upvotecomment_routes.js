// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for upvotecomments
const Upvotecomment = require('../models/upvotecomment')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { upvotecomment: { title: '', text: 'foo' } } -> { upvotecomment: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /upvotecomments
router.get('/upvotecomments', (req, res, next) => {
  if (req.query.comment) {
    Upvotecomment.find({comment_id: req.query.comment})
      .then(upvotecomments => {
        return upvotecomments.map(upvotecomment => upvotecomment.toObject())
      })
      .then(upvotecomments => res.status(200).json({upvotecomments: upvotecomments, comment: req.query.comment}))
      .catch(next)
  } else {
    Upvotecomment.find()
      .then(upvotecomments => {
        return upvotecomments.map(upvotecomment => upvotecomment.toObject())
      })
      .then(upvotecomments => res.status(200).json({ upvotecomments: upvotecomments }))
      // if an error occurs, pass it to the handler
      .catch(next)
  }
})

// SHOW
// GET /upvotecomments/5a7db6c74d55bc51bdf39793
router.get('/upvotecomments/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Upvotecomment.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "upvotecomment" JSON
    .then(upvotecomment => res.status(200).json({ upvotecomment: upvotecomment.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /upvotecomments
router.post('/upvotecomments', requireToken, (req, res, next) => {
  // set owner of new upvotecomment to be current user
  req.body.upvotecomment.owner = req.user.id
  Upvotecomment.find({owner: req.user.id, comment_id: req.body.upvotecomment.comment_id})
    .then(upvotecomments => {
      if (upvotecomments.length > 0) {
        res.status(400).json({errors: 'You can only upvotecomment once!'})
      } else {
        Upvotecomment.create(req.body.upvotecomment)
        // respond to succesful `create` with status 201 and JSON of new "upvotecomment"
          .then(upvotecomment => {
            res.status(201).json({ upvotecomment: upvotecomment.toObject() })
          })
        // if an error occurs, pass it off to our error handler
        // the error handler needs the error message and the `res` object so that it
        // can send an error message back to the client
          .catch(next)
      }
    })
})
// UPDATE
// PATCH /upvotecomments/5a7db6c74d55bc51bdf39793
router.patch('/upvotecomments/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.upvotecomment.owner

  Upvotecomment.findById(req.params.id)
    .then(handle404)
    .then(upvotecomment => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, upvotecomment)

      // pass the result of Mongoose's `.update` to the next `.then`
      return upvotecomment.updateOne(req.body.upvotecomment)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /upvotecomments/5a7db6c74d55bc51bdf39793
router.delete('/upvotecomments/:id', requireToken, (req, res, next) => {
  Upvotecomment.findById(req.params.id)
    .then(handle404)
    .then(upvotecomment => {
      // throw an error if current user doesn't own `upvotecomment`
      requireOwnership(req, upvotecomment)
      // delete the upvotecomment ONLY IF the above didn't throw
      upvotecomment.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
