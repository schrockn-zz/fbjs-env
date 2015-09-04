/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

var requiredModules = {
  babel: '5.8.21',
  'babel-core': '5.8.21',
  'babel-runtime': '5.8.20',
  'babel-eslint': '4.0.10',
  chai: '3.2.0',
  'chai-subset': '1.0.1',
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
    watch: 'babel resources/watch.js | node',
  },
  options: {
    mocha: '--require resources/mocha-bootload src/**/__tests__/**/*.js'
  },
};

var requiredDirectories = [ 'src', 'resources', 'src/__tests__' ];
var requiredNpmIgnores = [ 'resources', 'npm-debug.log', '*.swp', '.*' ];
var requiredGitIgnores = [ 'dist', 'npm-debug.log' ];

var files = {
  eslintrc: '.eslintrc',
  flowconfig: '.flowconfig',
  'mocha-bootload.js': 'resources/mocha-bootload.js',
  'watch.js': 'resources/watch.js',
  LICENSE: 'LICENSE',
  PATENTS: 'PATENTS',
};

function ensureFileExists(path) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '');
  }
}

function textifyObject(obj) {
  return JSON.stringify(obj, null, 2);
}

// TODO: figure out how to stream output
async function executeCommand(text) {
  console.log('Executing: ' + text);
  return await exec(text, (_, stdout) => console.log(stdout));
}

async function overwriteFile(file, text) {
  var returnValue = await fs.writeFile(file, text);
  console.log(`wrote file ${file}`);
  return returnValue;
}

export async function main(argv) {
  var command = argv[2];
  var targetDirectory = path.normalize(argv[3]);
  console.log('targetDirectory: ' + targetDirectory);

  function packagePath(p) {
    if (targetDirectory.endsWith('/')) {
      return `${targetDirectory}${p}`;
    } else {
      return `${targetDirectory}/${p}`;
    }
  }

  function appendRequiredIgnores(file, requiredIgnores) {
    var filePath = packagePath(file);

    ensureFileExists(filePath);

    var npmIgnoreContents = fs.readFileSync(filePath, 'utf8');
    var ignoresInFile = npmIgnoreContents.split('\n');
    console.log(ignoresInFile);
    requiredIgnores.forEach(ignore => {
      if (!ignoresInFile.includes(ignore)) {
        ignoresInFile.push(ignore);
      }
    });
    overwriteFile(filePath, ignoresInFile.join('\n'));
  }

  function sourcePath(path) {
    return `${__dirname}/../${path}`;
  }

  switch (command) {
    case 'create':
      // create directory
      await executeCommand(`mkdir -p ${targetDirectory}`);
      // create package file
      await overwriteFile(
        packagePath('package.json'),
        textifyObject(packageTemplate));
      // create required directories
      requiredDirectories.forEach(async dir => {
        await executeCommand(`mkdir -p ${packagePath(dir)}`);
      });
      // create .npmignore
      await overwriteFile(
        packagePath('.npmignore'),
        requiredNpmIgnores.join('\n')
      );
      // create .gitignore
      await overwriteFile(
        packagePath('.gitignore'),
        requiredGitIgnores.join('\n')
      );
      // copy files to locations
      Object.keys(files).forEach(async source => {
        var target = files[source];
        var sourceFilePath = sourcePath(`files/${source}`);
        await executeCommand(`cp ${sourceFilePath} ${packagePath(target)}`);
      });

      // create this so that npm run test works
      ensureFileExists(packagePath('/src/__tests__/testStub.js'));

      break;
    case 'update':
      var fileContents = fs.readFileSync(packagePath('package.json'), 'utf8');
      var packageObj = JSON.parse(fileContents);

      // overwrite package.json entries
      Object.keys(packageTemplate).forEach(key => {
        packageObj[key] = mergeIntoObj(packageObj[key], packageTemplate[key]);
      });

      overwriteFile(packagePath('package.json'), textifyObject(packageObj));
      // create directories if not there
      requiredDirectories.forEach(async dir => {
        await executeCommand(`mkdir -p ${packagePath(dir)}`);
      });

      // for each npmIgnore, grep .npmignore. append if necessary
      appendRequiredIgnores('.npmignore', requiredNpmIgnores);
      // samesies for .gitignore
      appendRequiredIgnores('.gitignore', requiredGitIgnores);
      // recopy files to locations
      Object.keys(files).forEach(async source => {
        var target = files[source];
        var sourceFilePath = sourcePath(`files/${source}`);
        await executeCommand(`cp ${sourceFilePath} ${packagePath(target)}`);
      });
      break;
    default:
      throw new Error(`unknown command ${command}`);
  }

  function mergeIntoObj(target, props) {
    var output = {...target};
    Object.keys(props).forEach(prop => {
      output[prop] = props[prop];
    });
    return output;
  }
}
