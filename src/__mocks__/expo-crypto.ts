// Manual mock for expo-crypto
let counter = 0;
module.exports = {
    randomUUID: () => `mock-uuid-${++counter}`,
};
