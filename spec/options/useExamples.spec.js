'use strict';

var getAjvInstances = require('../ajv_instances');
require('../chai').should();


describe('useExamples options', function() {
  it('should replace undefined property with default and fallback to examples first value', function() {
    var instances = getAjvInstances({
      allErrors: true,
      loopRequired: 3
    }, { useDefaults: true, useExamples:true });

    instances.forEach(test);

    function test(ajv) {
      var schema = {
        properties: {
          foo: { type: 'string', examples: ['abc'] },
          bar: { type: 'number', default: 1, examples: [2] },
          baz: { type: 'boolean', default: false },
          nil: { type: 'null', default: null },
          obj: { type: 'object', default: {} },
          arr: { type: 'array', default: [] }
        },
        required: ['foo', 'bar', 'baz', 'nil', 'obj', 'arr'],
        minProperties: 6
      };

      var validate = ajv.compile(schema);

      var data = {};
      validate(data) .should.equal(true);
      data .should.eql({ foo: 'abc', bar: 1, baz: false, nil: null, obj: {}, arr:[] });

      data = { foo: 'foo', bar: 2, obj: { test: true } };
      validate(data) .should.equal(true);
      data .should.eql({ foo: 'foo', bar: 2, baz: false, nil: null, obj: { test: true }, arr:[] });
    }
  });
});