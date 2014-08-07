'use strict';

var conf = require('nconf');
var logger = require('winston').loggers.get('gallery');
var magick = require('imagemagick');
var uuid = require('node-uuid');
var path = require('path');
var fs = require('fs');
var tmp = require('tmp');
var dataurl = require('dataurl');

function autoOrient(sourceImagePath, targetPath, callback) {
  if (logger.debug) {
    logger.debug('Auto-orienting `' + sourceImagePath + '\' into `' + targetPath + '\'');
  }
  magick.convert([sourceImagePath, '-auto-orient', targetPath], function (err, stdout) {
    if (err) {
      return callback(err, undefined);
    }
    if (logger.debug) {
      logger.debug('stdout:', stdout);
    }
    callback(undefined, targetPath);
  });
}

function scale(sourceImagePath, targetPath, width, height, fn) {
  if (logger.debug) {
    logger.debug('Scaling `' + sourceImagePath + '\' to ' + width + 'x' + height + ' into `' + targetPath + '\'');
  }
  magick.convert([sourceImagePath, '-scale', width + '!x' + height + '!', targetPath], function (err, stdout) {
    if (err) {
      return fn(err, undefined);
    }
    if (logger.debug) {
      logger.debug('stdout:', stdout);
    }
    fn(undefined, targetPath);
  });
}

function scaleWidth(sourceImagePath, targetPath, width, fn) {
  if (logger.debug) {
    logger.debug('Scaling `' + sourceImagePath + '\' to ' + width + 'x undefined into `' + targetPath + '\'');
  }
  magick.convert([sourceImagePath, '-scale', width, targetPath], function (err, stdout) {
    if (err) {
      return fn(err, undefined);
    }
    if (logger.debug) {
      logger.debug('stdout:', stdout);
    }
    fn(undefined, targetPath);
  });
}

function scaledImageId(id, width, height) {
  var ext = path.extname(id);
  return path.basename(id, ext) + '_' + width + 'x' + height + ext;
}

module.exports = {
  directory: function directory() {
    return conf.get('imageDirectory');
  },

  // @rradczewski Wird das hier noch benötigt, wenn wir auf Image Magick setzen?
  fs: function fs() {
    return require('fs');
  },

  storeImage: function storeImage(tmpImageFilePath, callback) {
    var id = uuid.v4() + path.extname(tmpImageFilePath);
    var persistentImageFilePath = this.directory() + '/' + id;

    autoOrient(tmpImageFilePath, persistentImageFilePath, function (err) {
      callback(err, id);
    });
  },

  storeImageFromDataURL: function storeImageFromDataURL(dataURL, callback) {
    var _this = this;

    var dataPackage = dataurl.parse(dataURL);
    if (!dataPackage || !dataPackage.mimetype.match(/image\/(jpg|jpeg)/)) {
      return callback(new Error('Not a valid dataURL'));
    }
    // Write to tmpFile
    tmp.file({postfix: '.jpg'}, function (err, path, fd) {
      fs.writeFile(path, dataPackage.data, {encoding: dataPackage.encoding}, function (err) {
        if (err) {
          return callback(err);
        }
        _this.storeImage(path, callback);
      });
    });
  },

  getMetadataForImage: function getMetadataForImage(id, callback) {
    var persistentImageFilePath = this.directory() + '/' + id;
    magick.readMetadata(persistentImageFilePath, callback);
  },

  retrieveScaledImage: function retrieveScaledImage(id, width, height, fn) {
    var compositeId = scaledImageId(id, width, height);
    var self = this;
    this.retrieveImage(compositeId, function (err, image) {
      if (err) {
        var scaledImagePath = err.persistentImageFilePath;
        return self.retrieveImage(id, function (err, sourceImagePath) {
          if (undefined === height) {
            return scaleWidth(sourceImagePath, scaledImagePath, width, function (err) {
              return self.retrieveImage(compositeId, fn);
            });
          }
          return scale(sourceImagePath, scaledImagePath, width, height, function (err) {
            return self.retrieveImage(compositeId, fn);
          });
        });
      }
      fn(null, image);
    });
  },

  retrieveImage: function retrieveImage(id, callback) {
    var persistentImageFilePath = this.directory() + '/' + id;

    this.fs().exists(persistentImageFilePath, function (exists) {
      if (!exists) {
        var error = new Error('Requested image ' + id + ' does not exist at ' + persistentImageFilePath);
        error.persistentImageFilePath = persistentImageFilePath;
        callback(error);
      } else {
        callback(null, persistentImageFilePath);
      }
    });
  }
};
