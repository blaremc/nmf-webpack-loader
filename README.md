# nmf-loader - A Webpack loader for Native Client manifests

This loader parses your .nmf file, searches for "url" occurences, copies
the assets into the output directory, replaces the url with the outputted path,
recompiles the .nmf JSON structure and returns a data url (e.g. `data:application/x-pnacl,{"program":...`).

## Usage

```bash
npm install nmf-loader --save-dev
```

webpack config:

```javascript
module.exports = {
  module: {
    loaders: [{
      test: /\.nmf$/,
      loader: 'nmf',
      query: {
        name: '[name].[hash:6].[ext]'
      }
    }, {
      test: /\.((nexe)|(pexe)|(so))$/, // will load .nexe, .pexe and .so files with file-loader
      loader: 'file-loader',
      query: {
        name: '[name].[hash:6].[ext]'
      }
    }]
  },
};
```

Example .nmf file, `my-nativeclient.nmf`:

```json
{
  "program": {
    "portable": {
      "pnacl-translate": {
        "url": "./my-native-app.pexe"
      }
    }
  }
}

```

In your application:

```javascript
const nmf = require('./my-nativeclient.nmf');

const embed = document.createElement('embed');
embed.setAttribute('src', nmf);

embed.setAttribute('width', 0);
embed.setAttribute('height', 0);
embed.setAttribute('type', 'application/x-pnacl');
document.body.appendChild(embed);
```
#### URL format

The loader replaces every occurence of `{"url": "[some nacl file url]"}` with the actual URL of the file, including public path and/or a hash in the filename. The NaCl file will also be copied into the project's output directory.

##### Formats:

1. "./my-module.pexe": Loads file from the same folder as the .nmf file
2. "my-module.pexe": Loads file from the same folder as the .nmf file
3. "~my-module": Will load file from "node_modules/my-module"

## Testing

```bash
npm test
```

#### License

Apache 2.0
