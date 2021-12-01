const { detectConfigOrDefault } = require("../utils/utils");

const command = {
  command: "version",
  description: "Show version number and exit",
  builder: {},
  help: {
    usage: "truffle version",
    options: [],
    allowedGlobalOptions: []
  },
  run: async function (options) {
    const version = require("../version");
    const {logger} = options;

    const config = detectConfigOrDefault(options);

    version.logAll(logger, config);
    return;
  }
};

module.exports = command;
