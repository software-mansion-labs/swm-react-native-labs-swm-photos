const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const path = require('path');

 /**
+ * Metro configuration
+ * https://facebook.github.io/metro/docs/configuration
  *
+ * @type {import('metro-config').MetroConfig}
  */
const config = {
  watchFolders: [
    path.resolve(__dirname, '../src'),
    path.resolve(__dirname, '../assets'),
  ],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    disableHierarchicalLookup: true,
    sourceExts: [
      ...(defaultConfig.resolver.sourceExts || []).map((ext) => `kpl.${ext}`),
      ...(defaultConfig.resolver.sourceExts || []).map((ext) => `tv.${ext}`),
      ...(defaultConfig.resolver.sourceExts || []),
    ],
  },
};

 
module.exports = mergeConfig(defaultConfig, config);