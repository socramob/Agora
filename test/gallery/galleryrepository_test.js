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

describe("the gallery repository on real files", function () {

  beforeEach(function useRealFilesystem() {
    service.fs = function fs() {
      return require('fs');
    };
  });

  it('stores the original image', function (done) {
    var storedImageId = 'image.jpg';
    var imagePath = __dirname + '/fixtures/' + storedImageId;
    service.storeImage(imagePath, function (err, imageId) {
      service.retrieveImage(imageId, function (err, imageFile) {
        expect(err).to.be.falsy();
        done();
      });
    });
  });

  it('provides scaled images', function (done) {
    var storedImageId = 'image.jpg';
    var imagePath = __dirname + '/fixtures/' + storedImageId;
    service.storeImage(imagePath, function (err, imageId) {
      service.retrieveScaledImage(imageId, 100, 100, function (err, imageFile) {
        expect(err).to.be.falsy();
        done();
      });
    });
  });

  it('stores a dataurl image', function (done) {
    var dataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD8qqKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/2Q==';
    service.storeImageFromDataURL(dataURL, function (err, imageId) {
      service.retrieveImage(imageId, function (err) {
        if (err) {
          done(err);
        }
        done();
      });
    });
  });

  it('provides exif data for a given image', function (done) {
    var storedImageId = 'exif_image.jpg';
    var imagePath = __dirname + '/fixtures/' + storedImageId;
    service.storeImage(imagePath, function (err, imageId) {
      service.getMetadataForImage(imageId, function (err, metadata) {
        expect(err).to.be.falsy();
        expect(metadata.exif).to.have.property("dateTimeOriginal");
        done();
      });
    });
  });

  it('returns err for invalid imageId', function (done) {
    service.retrieveImage('invalidId', function (err, imageFile) {
      expect(err).to.exist();
      done();
    });
  });

});

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
    // Because the implementation relies on the Image Magick CLI tools,
    it('is not unit tested');
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
