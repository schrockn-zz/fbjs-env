
var fs = require('fs');

var requiredModules = {
  babel: '5.8.21',
  'babel-core': '5.8.21',
  'babel-runtime': '5.8.20',
  'babel-eslint': '4.0.10',
  chai: '3.2.0',
  eslint: '1.1.0',
  'eslint-plugin-babel': '^2.1.1',
  'flow-bin': '0.14.0',
  mocha: '2.2.5',
  sane: '1.1.3',
};

var packageTemplate = {
  dependencies: {},
  devDependencies: requiredModules,
  babel: {
    optional: [
      'runtime',
      'es7.asyncFunctions'
    ]
  },
  scripts: {
    test: 'npm run lint && npm run check && npm run testonly',
    testonly: 'mocha $npm_package_options_mocha',
    lint: 'eslint src',
    check: 'flow check',
    watch: 'babel scripts/watch.js | node',
  },
  options: {
    mocha: '--require scripts/mocha-bootload src/**/__tests__/**/*.js'
  },
};

var requiredDirectories = [ 'src', 'scripts' ];
var npmIgnores = [ 'scripts', 'npm-debug.log', '*.swp', '.*' ];
var gitIgnores = [ 'dist', 'npm-debug.log' ];

var files = {
  eslintrc: '.eslintrc',
  flowconfig: '.flowconfig',
  'mocha-bootload.js': 'scripts/mocha-bootload.js',
  'watch.js': 'scripts/watch.js',
  LICENSE: 'LICENSE',
  PATENTS: 'PATENTS',
};

function textifyObject(obj) {
  return JSON.stringify(obj, null, 2);
}

import sys from 'sys'; 
import { exec } from 'child_process';

async function executeCommand(text) {
  console.log(text);
  function p(error, stdout, stderr) {
    console.log(stdout);
  }
  var result = await exec(text, (_, stdout) => console.log(stdout));
}

async function createFile(file, text) {
  var returnValue = await fs.writeFile(file, text);
  console.log(`created ${file}`);
  return returnValue;
}

export async function main(argv) {
  var command = argv[2];
  var targetDirectory = argv[3];

  function packagePath(p) {
    return `${targetDirectory}/${p}`;
  }

  switch (command) {
    case 'create':
      // create directory
      await executeCommand(`mkdir -p ${targetDirectory}`);
      // create package file
      await createFile(
        packagePath('package.json'),
        textifyObject(packageTemplate));
      // create required directories
      requiredDirectories.forEach(async (dir) => {
        await executeCommand(`mkdir -p ${packagePath(dir)}`);
      });
      // create .npmignore
      await createFile(packagePath('.npmignore'), npmIgnores.join('\n'));
      // create .gitignore
      await createFile(packagePath('.gitignore'), gitIgnores.join('\n'));
      // copy files to locations
      Object.keys(files).forEach(async (source) => {
        var target = files[source];
        await executeCommand(`cp files/${source} ${targetDirectory}/${target}`);
      });

      // npm install
      var scriptDir = process.cwd();
      process.chdir(targetDirectory);
      await executeCommand(`npm install`);
      process.chdir(scriptDir);

      break;
    case 'update':
      // load package, overwrite shit
      // check for directories
      // for each npmIgnore, grep .npmignore. append if necessary
      // samesies for .gitignore
      // recopy files to locations
      // blow away npm modules listed here
      // npm install
      break;
    default:
      throw new Error(`unknown command ${command}`);
  }
}
