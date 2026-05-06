// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.', // <--- Mude de 'src' para '.' para ele varrer o projeto inteiro
  testRegex: '.*\\.(spec|test)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'], // Ajuste o coverage para focar apenas no código fonte
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};