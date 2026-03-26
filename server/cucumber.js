module.exports = {
  default: {
    paths: ['acceptance/features/**/*.feature'],
    requireModule: ['ts-node/register/transpile-only'],
    require: ['acceptance/steps/**/*.ts', 'acceptance/support/**/*.ts'],
    format: ['progress']
  }
};
