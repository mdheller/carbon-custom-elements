/**
 * @license
 *
 * Copyright IBM Corp. 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const { readFile, writeFile } = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const { transformAsync } = require('@babel/core');
const babelPluginCreateReactCustomElementType = require('../../babel-plugin-create-react-custom-element-type');
const configure = require('../webpack.config');

const regexComponentsReactPath = /carbon-custom-elements[\\/]es[\\/]components-react[\\/](.*)$/;
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const mkdirpAsync = promisify(mkdirp);

const buildCreateReactCustomElementTypeBabelOpts = {
  babelrc: false,
  plugins: [
    ['@babel/plugin-syntax-decorators', { decoratorsBeforeExport: true }],
    '@babel/plugin-syntax-typescript',
    babelPluginCreateReactCustomElementType,
  ],
};

/**
 * Generates React wrapper module for the given custom element module.
 * @param {string} dst The file path of the generated React wrapper module.
 * @param {string} src The file path of the custom element module.
 */
const buildReactCustomElementTypeOnTheFly = async (dst, src) => {
  await mkdirpAsync(path.dirname(dst));
  const transformed = await transformAsync(await readFileAsync(src), {
    ...buildCreateReactCustomElementTypeBabelOpts,
    filename: src,
  });
  await writeFileAsync(dst, transformed.code);
};

class CreateReactCustomElementTypeProxyPlugin {
  /**
   * A WebPack resolver plugin that proxies module request for:
   *
   * * `carbon-custom-elements/es/components-react/**` to the corresponsing local path in this project
   * * `es/components`/`es/globals` to the corresponding source code, given the former may not have been built yet
   */
  constructor() {
    this.source = 'before-described-relative';
  }

  apply(resolver) {
    resolver.plugin(this.source, (request, callback) => {
      request.path = request.path.replace(/[\\/]es[\\/](components|globals)[\\/]/i, '/src/$1/');
      const tokens = regexComponentsReactPath.exec(request.path);
      if (!tokens) {
        // Bails if the request is not of the React wrapper module
        callback();
        return;
      }
      const src = path.resolve(__dirname, '../../src/components', `${tokens[1]}.ts`);
      const dst = path.resolve(__dirname, '../../es/components-react', `${tokens[1]}.js`);
      (process.env.NODE_ENV === 'production' ? Promise.resolve() : buildReactCustomElementTypeOnTheFly(dst, src)).then(() => {
        request.path = dst;
        callback();
      }, callback);
    });
  }
}

module.exports = ({ config, mode }) => {
  const massagedConfig = configure({ config, mode });
  const babelLoaderRule = massagedConfig.module.rules.find(
    item => item.use && item.use.some && item.use.some(use => /babel-loader/i.test(use.loader))
  );
  if (babelLoaderRule) {
    massagedConfig.module.rules.push({
      test: /\.tsx$/,
      use: babelLoaderRule.use.map(item => {
        const { presets } = item.options || {};
        return !presets || presets.indexOf('@babel/preset-react') >= 0
          ? item
          : {
              ...item,
              options: {
                ...item.options,
                presets: [...item.options.presets, '@babel/preset-react'],
              },
            };
      }),
    });
  }
  if (!massagedConfig.resolve.plugins) {
    massagedConfig.resolve.plugins = [];
  }
  massagedConfig.resolve.plugins.push(new CreateReactCustomElementTypeProxyPlugin());
  return massagedConfig;
};
