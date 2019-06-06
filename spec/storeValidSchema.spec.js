'use strict';

var Ajv = require('./Ajv');
var getAjvInstances = require('./ajv_instances');
require('./chai').should();

describe('storeValidData options', function() {
  it('should store all valid data and schemas', function() {
    var instances = getAjvInstances(
      {
        allErrors: true,
        loopRequired: 3,
      },
      { useDefaults: true, useExamples: true, shouldStoreValidSchema: true }
    );

    instances.forEach(test);

    function test(ajv) {
      var schema = {
        properties: {
          foo: { type: 'string', examples: ['abc'] },
          bar: { type: 'number', default: 1, examples: [2] },
          baz: { type: 'string' },
        },
        required: ['foo', 'bar', 'baz'],
      };

      var validate = ajv.addFormat('IOMessage').compile(schema);

      var data = { baz: 'test' };
      validate(data).should.equal(true);
      data.should.eql({ foo: 'abc', bar: 1, baz: 'test' });
      validate.validatedData.should.eql([
        { key: 'foo', value: 'abc', type: 'string', examples: ['abc'] },
        { key: 'bar', value: 1, type: 'number', default: 1, examples: [2] },
        { key: 'baz', value: 'test', type: 'string' },
      ]);
    }
  });

  it('should store all valid data and schemas and keep custom formats', function() {
    test(
      new Ajv({ allErrors: true, useDefaults: true, useExamples: true, shouldStoreValidSchema: true })
      .addFormat('IOMessage', {
        type: 'string',
        validate: function(x) {
          return x.length > 0;
        },
      })
    );

    function test(ajv) {
      var schema = {
        properties: {
          foo: { type: 'string', examples: ['abc'], format: 'IOMessage' },
        },
        required: ['foo'],
      };

      var validate = ajv.compile(schema);
      var data = {};

      validate(data).should.equal(true);
      data.should.eql({ foo: 'abc' });
      validate.validatedData.should.eql([{ key: 'foo', value: 'abc', type: 'string', examples: ['abc'], format: 'IOMessage' }]);
    }
  });
});
