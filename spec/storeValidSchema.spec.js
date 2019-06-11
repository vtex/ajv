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
        { key: 'foo', value: 'abc', type: 'string', examples: ['abc'], dataPath: ["foo"] },
        { key: 'bar', value: 1, type: 'number', default: 1, examples: [2], dataPath: ["bar"] },
        { key: 'baz', value: 'test', type: 'string', dataPath: ["baz"] },
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
      validate.validatedData.should.eql([
        { key: 'foo', value: 'abc', type: 'string', examples: ['abc'], format: 'IOMessage', dataPath: ["foo"] }
      ]);
    }
  });

  it('should store datapath of nested properties', function() {
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
          foo: { properties: {
            bar: { type: 'string', examples: ['abc'], format: 'IOMessage' }
          } },
        },
        required: ['foo'],
      };

      var validate = ajv.compile(schema);
      var data = {'foo': {} };

      validate(data).should.equal(true);
      data.should.eql({ foo: { bar: 'abc' }});
      validate.validatedData.should.eql([
        { key: 'foo', value: {bar: 'abc'}, properties: { bar: { type: 'string', examples: ['abc'], format: 'IOMessage' } }, dataPath: ['foo'] },
        { key: 'bar', value: 'abc', type: 'string', examples: ['abc'], format: 'IOMessage', dataPath: ['foo', 'bar'] }]);
    }
  });

  it('should store datapath of dependencies properties', function() {
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
        dependencies: {
          foo: {
            oneOf:[
              {
                properties: {
                  foo: {
                    enum: ['0']
                  },
                  bar: { type: 'string', default: 'abc', format: 'IOMessage' }
                },
                required: ['bar']
              },
              {
                properties: {
                  foo: {
                    enum: ['1']
                  },
                  baz: { type: 'string', default: 'abc', format: 'IOMessage' }
                }
              }
            ]
          }
        },
        properties: {
          foo: {
            enum: ['0', '1']
          }
        },
        required: ['foo']
      };

      var validate = ajv.compile(schema);
      var data = {foo: '0', bar: 'abc' };

      validate(data).should.equal(true);
      data.should.eql({ foo: '0', bar: 'abc' });
      validate.validatedData.should.eql([
        { key: 'foo', value: '0', enum: ['0'], dataPath: ['foo'] },
        { key: 'bar', value: 'abc', type: 'string', default: 'abc', format: 'IOMessage', dataPath: ['bar'] },
        { key: 'foo', value: '0', enum: ['1'], dataPath: ['foo'] },
        { key: 'foo', value: '0', enum: ['0', '1'], dataPath: ['foo'] },
      ]
      );
    }
  });

  it('should store datapath of arrays with integer indexes', function() {
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
          prop1: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  enum: [
                    'foo',
                    'bar',
                    'baz'
                  ]
                }
              }
            }
          }
        }
      };

      var validate = ajv.compile(schema);
      var data = { prop1: [ { name: 'foo' }, {name: 'baz'} ] };

      validate(data).should.equal(true);
      data.should.eql({ prop1: [ { name: 'foo' }, {name: 'baz'} ] });
      validate.validatedData.should.eql([
        { key: 'prop1', value: [{ name: 'foo' }, {name: 'baz'}], type: 'array', items: { type: 'object', properties: { name: { type: 'string', enum: ['foo', 'bar', 'baz']}}} , dataPath: ['prop1'] },
        { key: 'name', value: 'foo', type: 'string', enum: ['foo', 'bar', 'baz'], dataPath: ['prop1', 0, 'name'] },
        { key: 'name', value: 'baz', type: 'string', enum: ['foo', 'bar', 'baz'], dataPath: ['prop1', 1, 'name'] }
      ]
      );

      data = { prop1: [ { name: 'foo' }, {name: 'xpto'} ] };
      validate(data).should.equal(false);
    }
  });
});
