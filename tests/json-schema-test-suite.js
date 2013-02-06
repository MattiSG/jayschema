// Unit tests. Run with mocha.
//
// Execute tests defined in the JSON Schema Test Suite from:
// https://github.com/json-schema/JSON-Schema-Test-Suite
//
// At the time of this writing, the tests are against JSON Schema
// Draft v3 (we support v4). Therefore some of the tests are not
// applicable, or fail due to specification changes. Those tests are
// are blacklisted and skipped below.

/*global describe:true it:true */


var should = require('should')
  , JaySchema = require('../jayschema.js')
  , fs = require('fs')
  , path = require('path')
  ;

var BLACKLISTED_TESTS = {

  'format.json': {
    '*': 'optional feature not supported by this validator yet'
  },

  'dependencies.json': {
    dependencies: {
      '*': 'dependency values must be array or object in v4 (§ 5.4.5.1)'
    }
  },

  'disallow.json': {
    '*': 'disallow keyword removed from v4'
  },

  'divisibleBy.json': {
    '*': 'divisibleBy keyword removed from v4 (see multipleOf)'
  },

  'required.json': {
    '*': '"required" works differently in v4'
  },

  'type.json': {
    'any type matches any type': {
      '*': 'the "any" type is not in v4'
    },

    'integer type matches integers': {
      'a float is not an integer even without fractional part':
        'no longer enforced in v4'
    },

    'types can include schemas': {
      '*': 'types cannot include schemas in v4'
    },

    'when types includes a schema it should fully validate the schema': {
      '*': 'types cannot include schemas in v4'
    },

    'types from separate schemas are merged': {
      '*': 'types cannot include schemas in v4'
    }
  },

  'extends.json': {
    '*': 'extends keyword removed from v4'
  }

};

function shouldSkip(jsonFile, testGroup, test) {
  var basename = path.basename(jsonFile);
  if (basename in BLACKLISTED_TESTS) {
    var items = BLACKLISTED_TESTS[basename];
    if ('*' in items) { return true; }
    if (testGroup in items) {
      if ('*' in items[testGroup] || test in items[testGroup]) {
        return true;
      }
    }
  }

  return false;
}

function getTests(dir) {
  var dirEntries = fs.readdirSync(dir);

  var files = [];
  var dirs = [];

  dirEntries.forEach(function(entry) {
    var fullPath = path.join(dir, entry);
    var stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      dirs.push(fullPath);
    } else if (stats.isFile()) {
      if (path.extname(entry) === '.json') {
        files.push(fullPath);
      }
    }
  });

  dirs.forEach(function(dir) {
    files = files.concat(getTests(dir));
  });

  return files;
}

describe('JSON Schema Test Suite:', function() {

  var files = getTests(path.join(__dirname, 'JSON-Schema-Test-Suite'));

  for (var index = 0, len = files.length; index !== len; ++index) {
    var jsonFile = files[index];
    var testGroups = require(jsonFile);

    testGroups.forEach(function(group) {
      describe(path.basename(jsonFile) + '/' + group.description + ':',
        function()
      {
        group.tests.forEach(function(test) {

          if (!shouldSkip(jsonFile, group.description, test.description)) {
            it(test.description, function() {
              var jj = new JaySchema();
              var result = jj.validate(test.data, group.schema);
              if (test.valid) {
                result.should.be.empty;
              } else {
                result.should.not.be.empty;
              }
            });
          }

        }, this);
      });
    }, this);

  }
});