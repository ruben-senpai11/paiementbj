const appJson = require('./app.json');

module.exports = ({ config }) => {
  const baseConfig = config || appJson.expo;
  const rawBaseUrl = (process.env.EXPO_PUBLIC_WEB_BASE_URL || '').trim();
  if (!rawBaseUrl) {
    return baseConfig;
  }
  const normalizedBaseUrl = rawBaseUrl.startsWith('/') ? rawBaseUrl : `/${rawBaseUrl}`;
  return {
    ...baseConfig,
    experiments: {
      ...(baseConfig.experiments || {}),
      baseUrl: normalizedBaseUrl.replace(/\/+$/, ''),
    },
  };
};
