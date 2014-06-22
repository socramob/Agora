'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var persistence = conf.get('beans').get('activityresultsPersistence');
var store = conf.get('beans').get('activityresultstore');

describe('ActivityResult store', function () {
  var activityResult = {id: 'Hackergarten2', photos: [{uri: '/path/to/image1.jpg'}]};
  var getById;

  beforeEach(function () {
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, activityResult);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('the getActivityResultById method', function () {
    it('should return the activityResult for an id', function (done) {
      store.getActivityResultById(activityResult.id, function (err, activityResult) {
        activityResult.should.have.property('id', activityResult.id);
        done();
      });
    });

    it('should return an error if activity does not exist', function (done) {
      getById.restore();
      sinon.stub(persistence, 'getById', function (object, callback) {
        return callback(new Error('not found'), null);
      });

      store.getActivityResultById('non-existing-id', function (err, activityResult) {
        expect(err).to.exist();
        expect(activityResult).to.be.null();
        done();
      });
    });
  });
});