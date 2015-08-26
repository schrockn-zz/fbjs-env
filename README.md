fbjs-env is a set of scripts used to manage a node module and keep
it up-to-date with the latest features of babel, eslint, flow
and to provide some facilities for javascript development.

### Usage

To create a package:

```
fbjs-env create some-package
```

This will create a scaffolding with the following elements:

* A package.json with the supported versions of babel, eslint, flow, mocha, chai.
* A .eslintrc and .flowconfig to configure eslint and flow respectively
* A src directory where you place your uncompiled ES6 code.
* Scripts:
  * mocha-bootload.js: This does runtime compilation of ES6 to ES5 so
    that tests are run without a build step
  * watch.js: This is used by npm run watch
* An .npmignore that ignores the target directory for compiled code (dist)
  as well as other things
* A .gitignore with appropriate exclusions.

Package.json has the following commands:

* npm run watch: Run this in its own terminal. It monitors the file system
  and runs lint, flow checks, and test on every file save.
* npm run lint: Run lint
* npm run testonly: Run only test without lint checks. This is useful for
  TDD-style development where you might not be lint-compliant all the time.
* npm run check: Do a flow check

```fbjs-env update some-package```

This command *updates* an existing package that conforms to the fbenv standards.

It rewrites package.json while preserving the entries in package.json which
fbenv does not control. It also only adds to .gitignore and .npmignore. Existing
entries are not deleted. It completely overwrites any scripts in the file system.

* It overwrites entries in package.json that fbenv controls
  * Modules:
    * babel
    * babel-core
    * babel-runtime
    * babel-eslint
    * chai
    * eslint
    * eslint-plugin-babel
    * flow-bin
    * mocha
    * sane
  * package.json Scripts:
    * test
    * testonly
    * lint
    * check
    * watch
  * scripts:
    * scripts/mocha-bootload.js
    * scripts/watch.js
