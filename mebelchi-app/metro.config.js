const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .glsl / .vert / .frag shader assets (used by some three.js examples)
config.resolver.assetExts.push('glsl', 'vert', 'frag');

module.exports = config;
