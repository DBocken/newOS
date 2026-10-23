// Mock the native AsyncStorage module with the library's in-memory jest mock
// so the persisted zustand store can be exercised in unit tests.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
