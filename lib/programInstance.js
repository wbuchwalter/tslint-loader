var Linter = require('tslint').Linter;

var program;

function getProgram(configFile,
                    projectDirectory) {
  if (program == null) {
    program = Linter.createProgram(configFile, projectDirectory);
  }
  return program;
}

function clearProgram() {
  program = null;
}

module.exports = {
  getProgram: getProgram,
  clearProgram: clearProgram
};
