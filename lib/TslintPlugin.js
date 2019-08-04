var programInstance = require('./programInstance');

function TslintPlugin () {}
TslintPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', programInstance.clearProgram);
};

module.exports = TslintPlugin;
