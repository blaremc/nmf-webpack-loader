const path = require('path');
const fs = require('fs');
const loaderUtils = require('loader-utils');

// 1) Parses Native Client Manifests
// 2) Detects assets required
// 3) Adds dependency to these assets, and updates paths (possibly hashed)
// https://developer.chrome.com/native-client/reference/nacl-manifest-format
module.exports = function (source) {
  this.cacheable();
  const callback = this.async();
  const context = this;

  const data = JSON.parse(source);

  var query = loaderUtils.parseQuery(this.query);
  var configKey = query.config || "nmfLoader";
  var options = this.options[configKey] || {};

  const config = makeConfig(options, query);

  function replaceUrl(url) {
    return new Promise((resolve, reject) => {
      importFile.call(context, config, url, (err, result) => {
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
      return Promise.all(data.map(recursiveReplaceUrls)).then(stringified => '[' + stringified.join(',\n') + ']');
    } else if (Object.prototype.toString.call(data) === '[object Object]') {
      return Promise.all(Object.keys(data).map(key => {
        if (key === 'url') {
          return replaceUrl(data[key]).then(replaced => `"url": ${replaced}`);
        } else {
          return recursiveReplaceUrls(data[key]).then(recursive => JSON.stringify(key) + ': ' + recursive);
        }
      })).then(stringified => '{' + stringified.join(',\n') + '}');
    } else {
      return Promise.resolve(JSON.stringify(data));
    }
  }

  recursiveReplaceUrls(data).then(res => {
    const importRuntime = "var runtime = require(" +
      loaderUtils.stringifyRequest(this, "!" + require.resolve("./runtime.js")) +
      ");";
    const code = importRuntime + 'module.exports = "data:application/x-pnacl," + JSON.stringify(' +res + ');';
    callback(null, code);
  }).catch(err => {
    callback(err);
  });
};

// This snippet is borrowed from webpack's file-loader
function makeConfig(options, query) {
  const config = {
    publicPath: false,
    name: "[hash].[ext]"
  };

  // options takes precedence over config
  Object.keys(options).forEach(function(attr) {
    config[attr] = options[attr];
  });

  // query takes precedence over config and options
  Object.keys(query).forEach(function(attr) {
    config[attr] = query[attr];
  });
  return config;
}

function importFile(config, file, callback) {
  const moduleRequest = loaderUtils.urlToRequest(file);
  const dirname = path.dirname(this.resource);
  this.resolve(dirname, moduleRequest, (err, filename) => {
    if (err) {
      callback(err);
    } else {
      const binaryData = fs.readFileSync(filename);

      const _oldResource = this.resource;
      this.resource = filename;

      const {name, ext} = path.parse(filename);

      const newName = config.name.replace('[name]', name).replace('.[ext]', ext);

      var url = loaderUtils.interpolateName(this,  newName, {
        context: config.context || this.options.context,
        content: binaryData,
        regExp: config.regExp
      });
      this.resource = _oldResource;

      var publicPath = "__webpack_public_path__ + " + JSON.stringify(url);

      if (config.publicPath) {
        // support functions as publicPath to generate them dynamically
        publicPath = JSON.stringify(
          typeof config.publicPath === "function"
            ? config.publicPath(url)
            : config.publicPath + url
        );
      }

      this.emitFile(url, binaryData);

      const request = 'runtime.absolutePath(require(' + loaderUtils.stringifyRequest(this, moduleRequest) + '))';
      callback(null, request);
    }
  });
}
