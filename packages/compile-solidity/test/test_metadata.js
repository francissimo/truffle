const debug = require("debug")("compile:test:test_metadata");
const tmp = require("tmp");
tmp.setGracefulCleanup();
const fs = require("fs");
const path = require("path");
const { Compile } = require("@truffle/compile-solidity");
const Resolver = require("@truffle/resolver");
const { CompilerSupplier } = require("../dist/compilerSupplier");
const assert = require("assert");
const { findOne } = require("./helpers");
const workingDirectory = "/Users/work/code/tmptmp";
// tmp.dirSync({ unsafeCleanup: true }).name; //tmp uses callbacks, not promises, so using sync

const solcConfig = {
  version: "0.4.25",
  settings: {
    optimizer: {
      enabled: false,
      runs: 200
    }
  }
};

const compileOptions = {
  working_directory: workingDirectory,
  compilers: {
    solc: solcConfig
  }
};
const supplierOptions = {
  solcConfig,
  events: {
    emit: () => {}
  }
};

describe("Compile - solidity ^0.4.0", function () {
  this.timeout(5000); // solc
  let source = null;
  let solc = null; // gets loaded via supplier
  let options;

  before("get solc", async function () {
    this.timeout(40000);

    const supplier = new CompilerSupplier(supplierOptions);
    ({ solc } = await supplier.load());
  });

  describe("Metadata", function () {
    let sourcePath;

    before("Set up temporary directory and project", async function () {
      // tmpdir = "/Users/work/code/tmptmp";
      const contracts_directory = path.join(workingDirectory, "./contracts");
      await fs.promises.mkdir(contracts_directory);
      options = {
        working_directory: workingDirectory,
        contracts_directory,
        contracts_build_directory: path.join(
          workingDirectory,
          "./build/contracts"
        ), //nothing is actually written, but resolver demands it
        compilers: {
          solc: solcConfig
        },
        quiet: true
      };
      options.resolver = new Resolver(options);
      sourcePath = path.join(options.contracts_directory, "SimpleOrdered.sol");
      await fs.promises.copyFile(
        path.join(__dirname, "./sources/v0.4.x/SimpleOrdered.sol"),
        sourcePath
      );
    });

    it.only("does not include absolute paths in metadata", async function () {
      console.log("\t\t\t >>>>", workingDirectory);
      const sourcePath = path.join(
        workingDirectory,
        "contracts",
        "SimpleOrdered.sol"
      );

      const sources = { [sourcePath]: source };
      console.log("\t\t\t>>>>>hereeeee %O", sources);
      const { compilations } = await Compile.sources({
        sources,
        options: compileOptions
      });

      debug("compilations: %0", compilations);

      const SimpleOrdered = findOne("SimpleOrdered", compilations[0].contracts);
      const metadata = JSON.parse(SimpleOrdered.metadata);
      const metadataSources = Object.keys(metadata.sources);
      const metadataTargets = Object.keys(metadata.settings.compilationTarget);
      const metadataPaths = metadataSources.concat(metadataTargets);

      debug("metadataPaths: %O", metadataPaths);
      assert(
        metadataPaths.every(
          sourcePath =>
            sourcePath.startsWith("project:/") && !sourcePath.includes(tmpdir)
        )
      );
    });
  });
});
