const path = require('path');

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['../src'],
      alias: {
        '@/assets': '../assets',
        '@': '../src',
        'expo-asset': path.resolve(__dirname, 'node_modules', '@amzn/expo-asset'),
        'expo-constants': path.resolve(__dirname, 'node_modules', '@amzn/expo-constants'),
        'expo-file-system': path.resolve(__dirname, 'node_modules', '@amzn/expo-file-system'),
        'expo-font': path.resolve(__dirname, 'node_modules', '@amzn/expo-font'),
        'expo-image': path.resolve(__dirname, 'node_modules', '@amzn/expo-image'),
        'expo-image-manipulator': path.resolve(__dirname, 'node_modules', '@amzn/expo-image-manipulator'),
        'expo-splash-screen': path.resolve(__dirname, 'node_modules', '@amzn/expo-splash-screen'),
        'react-native-mmkv': path.resolve(__dirname, 'node_modules', '@amzn/react-native-mmkv'),
        'react-native-reanimated': path.resolve(__dirname, 'node_modules', '@amzn/react-native-reanimated'),
        'react-native-safe-area-context': path.resolve(__dirname, 'node_modules', '@amzn/react-native-safe-area-context'),
        'react-native-screens': path.resolve(__dirname, 'node_modules', '@amzn/react-native-screens'),
        'react-native-svg': path.resolve(__dirname, 'node_modules', '@amzn/react-native-svg'),
        '@shopify/flash-list': path.resolve(__dirname, 'node_modules', '@amzn/shopify__flash-list'),
      },
    }],
    require(path.resolve(__dirname, 'node_modules/@amzn/react-native-reanimated/plugin')),
  ],
};