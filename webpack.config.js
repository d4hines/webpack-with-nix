const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = (_env, _argv) => {
  return {
    entry: "./main.js",
    output: {
      filename: "[name].bundle.js",
      path: __dirname,
    },
    devServer: {
      port: 3000,
      historyApiFallback: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
      ],
    },
    plugins: [
      new NodePolyfillPlugin(),
    ],
  };
};
