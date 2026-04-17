const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withApkSplits(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;
    
    // Enable ABI splits by transforming the default false to true
    if (buildGradle.includes('def enableSeparateBuildPerCPUArchitecture = false')) {
      buildGradle = buildGradle.replace(
        /def enableSeparateBuildPerCPUArchitecture = false/g,
        'def enableSeparateBuildPerCPUArchitecture = true'
      );
    } else {
      // Fallback for custom configurations if it's not strictly 'false'
      buildGradle = buildGradle.replace(
        /def enableSeparateBuildPerCPUArchitecture = .*/g,
        'def enableSeparateBuildPerCPUArchitecture = true'
      );
    }
    
    config.modResults.contents = buildGradle;
    return config;
  });
};
