// Default NetInfo for every test: online. Tests that need offline mock it themselves.
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
