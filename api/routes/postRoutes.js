const express = require('express');

const commentController = require('../controllers/commentController');
const postController = require('../controllers/postController');

const router = express.Router();

router.route('/')
  .get(postController.findAllPosts)
  .post(postController.createPost);

router.route('/:id')
  .get(postController.findPostById)
  .put(postController.updatePost)
  .delete(postController.deletePost);

router.route('/:id/comments')
  .get(commentController.findAllPostComments);

module.exports = router;
