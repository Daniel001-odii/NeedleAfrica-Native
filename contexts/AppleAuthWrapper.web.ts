// contexts/AppleAuthWrapper.web.ts
const appleAuthMock = {
  Operation: { LOGIN: 'LOGIN' },
  Scope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
  Error: { CANCELED: 'CANCELED' },
  performRequest: async () => {
    throw new Error('Apple Sign-In is not supported on Web.');
  }
};

export default appleAuthMock;