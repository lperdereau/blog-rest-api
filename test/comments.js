process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const app = require('../api/app');
const Author = require('../api/models/authorModel');
const Comment = require('../api/models/commentModel');
const Post = require('../api/models/postModel');
const User = require('../api/models/userModel');

/* eslint-disable no-unused-vars */
const should = chai.should();
/* eslint-enable no-unused-vars */

chai.use(chaiHttp);

faker.locale = 'pt_BR';

function randomId(arr) {
  /* eslint-disable no-underscore-dangle */
  return arr[Math.floor(Math.random() * arr.length)]._id;
  /* eslint-enable no-underscore-dangle */
}

describe('Comments', function () {
  // Delete and populate database before tests
  before(function () {
    return Promise.all([
      Author.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      User.deleteMany({}),
    ]).then(() => {
      const users = [...new Array(50)]
        .map(() => new User({
          name: faker.name.findName(),
          email: faker.internet.exampleEmail(),
        }));

      const authors = [...new Array(10)]
        .map(() => new Author({
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
        }));

      const comments = [...new Array(100)]
        .map(() => new Comment({
          content: faker.lorem.words(),
          user: randomId(users),
        }));

      const posts = [...new Array(10)]
        .map(() => new Post({
          title: faker.lorem.words(),
          subtitle: faker.lorem.words(),
          content: faker.lorem.paragraphs(),
          authors: [randomId(authors)],
          comments: [...new Array(10)]
            .map(() => randomId(comments)),
        }));

      return Promise.all([
        ...(users.map(user => user.save())),
        ...(authors.map(author => author.save())),
        ...(comments.map(comment => comment.save())),
        ...(posts.map(post => post.save())),
      ]);
    });
  });

  afterEach(function () {
    // Delete every model to prevent error in mocha watch mode
    mongoose.deleteModel(/.+/);
  });

  after(function () {
    mongoose.connection.close();
  });

  describe('GET requests', function () {
    it('should get all comments from a blog post', function () {
      Post.findOne()
        .then(({ _id }) => chai.request(app)
          .get(`/posts/${_id}/comments`))
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.forEach((comment) => {
            comment.should.be.a('object');
            comment.should.have.property('content');
            comment.should.have.property('published');
            comment.should.have.property('user');
          });
        });
    });
  });

  describe('POST requests', function () {
    it('should store new comment to a blog post', function () {
      return Promise.all([
        User.findOne(),
        Post.findOne(),
      ])
        .then(([user, post]) => {
          /* eslint-disable no-underscore-dangle */
          const comment = {
            content: faker.lorem.words(),
            user: user._id,
          };

          return chai.request(app)
            .post(`/posts/${post._id}/comments`)
            .send(comment);
          /* eslint-enable no-underscore-dangle */
        })
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('content');
          res.body.should.have.property('published');
          res.body.should.have.property('user');
        });
    });

    it('should store new comment without content', function () {
      return Promise.all([
        User.findOne(),
        Post.findOne(),
      ])
        .then(([user, post]) => {
          /* eslint-disable no-underscore-dangle */
          const comment = { user: user._id };

          return chai.request(app)
            .post(`/posts/${post._id}/comments`)
            .send(comment);
          /* eslint-enable no-underscore-dangle */
        })
        .then((res) => {
          res.should.have.status(422);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(1);
          res.body[0].should.have.property('error');
          res.body[0].should.have.property('name').eql('ValidationError');
          res.body[0].should.have.property('path');
        });
    });
  });
});