module.exports = {
  entry: './test/index.js',
  output: {
    path: 'test/tmp',
    filename: 'dist.js',
    publicPath: '/my-public-path/'
  },
  module: {
    loaders: [{
      test: /\.nmf$/,
      loader: 'nmf',
      query: {
        name: '[name].[hash:6].[ext]'
      }
    }, {
      test: /\.((nexe)|(pexe)|(so))$/,
      loader: 'file-loader',
      query: {
        name: '[name].[hash:6].[ext]'
      }
    }],
    noParse: [
      /runtime\.js$/
    ]
  },
  resolveLoader: {
    modulesDirectories: ['../src', '../node_modules']
  },
  target: "web"
};
