var should = require('chai').should();
var api = require('supertest')('http://127.0.0.1:8080');
var server = require('../fweet.js');

describe('Authentication', function() {

  it('errors if wrong basic auth', function(done) {
    api.get('/')
    .auth('incorrect', 'credentials')
    .expect(401, done)
  });

  it('succeed if proper basic auth', function(done) {
    api.get('/')
    .auth('qxip', 'qxip')
    // .expect({error:"Bad or missing app identification header"}, done),
    .expect(200, done);
  });

});


describe('/get/timeline', function() {

  it('post to thing', function(done) {
    api.get('/post/qxip?status=test')
    .auth('qxip', 'qxip')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.have.property('data');
      done();
    });
  });
  
  it('returns thing posts as JSON', function(done) {
    api.get('/get/timeline')
    .auth('qxip', 'qxip')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.have.property('data');
      done();
    });
  });

  it('remove all posts by thing', function(done) {
    api.get('/del/all/qxip')
    .auth('qxip', 'qxip')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.have.property('data');
      done();
    });
  });

});
