'use strict';

function SimpleFormatter() {}

SimpleFormatter.prototype.format = function (failures) {
  var outputLines = failures.map(function (failure) {
    return failure.getFailure();
  });
  return outputLines.join("\n") + "\n";
};

module.exports.Formatter = SimpleFormatter;
