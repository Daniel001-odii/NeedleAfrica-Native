import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      rootApiUrl: process.env.ROOT_API_URL,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    },
  };
};
