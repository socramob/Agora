'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var fs = require('fs');
var mock = require('mock-fs');
var stream = require('stream');
var service = require('../../lib/gallery/galleryrepositoryService');

var directoryForUploads = require('os').tmpdir();

var pathToExistingImage = '/sample/tmp/file.jpg';

function createTempFileWithContent(tmpFilePath, fileContent) {
  /*jslint node: true, stupid: true */
  service.fs().writeFile(tmpFilePath, fileContent, {}, function (err) {
    service.fs().readFileSync(tmpFilePath).toString().must.be.equal(fileContent);
  });
}

describe("the gallery repository", function () {
  beforeEach(function resetMockedFs() {
    var files = {};
    files[pathToExistingImage] = "Content_of_sample_image";
    var mockedFs = mock.fs(files);
    service.fs = function fs() {
      return mockedFs;
    };
  });

  beforeEach(function setImageDirectory() {
    conf.set('imageDirectory', directoryForUploads);
  });


  it('should retrieve the document folder from nconf', function () {
    expect(service.directory()).to.equal(directoryForUploads);
  });

  describe('storeImage', function () {
    it('should call a callback as result', function (done) {
      service.storeImage(null, function (err) {
        done();
      });
    });

    it('should expect an existing file and throw an error if it is not provided', function (done) {
      service.storeImage('/tmp/file/that/does/not/exist.png', function (err) {
        err.must.be.an.instanceof(Error);
        done();
      });
    });

    it('should store an image and return a uuid with the given extension', function (done) {
      service.storeImage(pathToExistingImage, function (err, uuid) {
        expect(err).to.be.falsy();
        expect(uuid).to.exist();
        expect(uuid).to.match(/\w\.\w+$/);
        done();
      });
    });

    it('should fail if the target directory is not set', function (done) {
      var pathThatDoesNotExist = '/path/does/not/exist';
      conf.set('imageDirectory', pathThatDoesNotExist);
      service.storeImage(pathToExistingImage, function (err, uuid) {
        expect(err).to.exist();
        expect(err.message).to.include(pathThatDoesNotExist);
        done();
      });
    });
  });

  describe('retrieveImage', function () {
    it('should return a file of an image stored with given uuid', function (done) {
      // Given
      var tmpFileContent = "Our tempfile Content";
      var tempImageUuid = 'ourtempuuid';
      var tmpFilePath = service.directory() + '/' + tempImageUuid;

      createTempFileWithContent(tmpFilePath, tmpFileContent);

      // When
      service.retrieveImage(tempImageUuid, function (err, imageFile) {
        expect(err).to.be.falsy();
        service.fs().exists(imageFile, function (exists) {
          // Expect
          exists.must.be.true();
          done();
        });
      });
    });
  });
});