'use strict';

const assert = require('chai').assert;
const libIndex = require('../lib');

describe('index', function () {

    console.error = () => { };

    describe("constructor", function () {
        it("Check that the class 'Bme680' is returned", function () {
            // Assert
            assert.equal('Bme680', libIndex.Bme680.name);

        });
    });
});