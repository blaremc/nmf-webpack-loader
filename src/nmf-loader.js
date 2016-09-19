'use strict';

var path = require('path');
var fs = require('fs');
var loaderUtils = require('loader-utils');

// 1) Parses Native Client Manifests
// 2) Detects assets required
// 3) Adds dependency to these assets, and updates paths (possibly hashed)
// https://developer.chrome.com/native-client/reference/nacl-manifest-format
module.exports = function (source) {
  var _this = this;

  this.cacheable();
  var callback = this.async();
  var context = this;

  var data = JSON.parse(source);

  var query = loaderUtils.parseQuery(this.query);
  var configKey = query.config || "nmfLoader";
  var options = this.options[configKey] || {};

  var config = makeConfig(options, query);

  function replaceUrl(url) {
    return new Promise(function (resolve, reject) {
      importFile.call(context, config, url, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  function recursiveReplaceUrls(data) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(recursiveReplaceUrls)).then(function (stringified) {
        return '[' + stringified.join(',\n') + ']';
      });
    } else if (Object.prototype.toString.call(data) === '[object Object]') {
      return Promise.all(Object.keys(data).map(function (key) {
        if (key === 'url') {
          return replaceUrl(data[key]).then(function (replaced) {
            return '"url": ' + replaced;
          });
        } else {
          return recursiveReplaceUrls(data[key]).then(function (recursive) {
            return JSON.stringify(key) + ': ' + recursive;
          });
        }
      })).then(function (stringified) {
        return '{' + stringified.join(',\n') + '}';
      });
    } else {
      return Promise.resolve(JSON.stringify(data));
    }
  }

  recursiveReplaceUrls(data).then(function (res) {
    var importRuntime = "var runtime = require(" + loaderUtils.stringifyRequest(_this, "!" + require.resolve("./runtime.js")) + ");";
    var code = importRuntime + 'module.exports = "data:application/x-pnacl," + JSON.stringify(' + res + ');';
    callback(null, code);
  }).catch(function (err) {
    callback(err);
  });
};

// This snippet is borrowed from webpack's file-loader
function makeConfig(options, query) {
  var config = {
    publicPath: false,
    name: "[hash].[ext]"
  };

  // options takes precedence over config
  Object.keys(options).forEach(function (attr) {
    config[attr] = options[attr];
  });

  // query takes precedence over config and options
  Object.keys(query).forEach(function (attr) {
    config[attr] = query[attr];
  });
  return config;
}

function importFile(config, file, callback) {
  var _this2 = this;

  var moduleRequest = loaderUtils.urlToRequest(file);
  var dirname = path.dirname(this.resource);
  this.resolve(dirname, moduleRequest, function (err, filename) {
    if (err) {
      callback(err);
    } else {
      var binaryData = fs.readFileSync(filename);

      var _oldResource = _this2.resource;
      _this2.resource = filename;

      var _path$parse = path.parse(filename);

      var name = _path$parse.name;
      var ext = _path$parse.ext;


      var newName = config.name.replace('[name]', name).replace('.[ext]', ext);

      var url = loaderUtils.interpolateName(_this2, newName, {
        context: config.context || _this2.options.context,
        content: binaryData,
        regExp: config.regExp
      });
      _this2.resource = _oldResource;

      var publicPath = "__webpack_public_path__ + " + JSON.stringify(url);

      if (config.publicPath) {
        // support functions as publicPath to generate them dynamically
        publicPath = JSON.stringify(typeof config.publicPath === "function" ? config.publicPath(url) : config.publicPath + url);
      }

      _this2.emitFile(url, binaryData);

      var request = 'runtime.absolutePath(require(' + loaderUtils.stringifyRequest(_this2, moduleRequest) + '))';
      callback(null, request);
    }
  });
}
