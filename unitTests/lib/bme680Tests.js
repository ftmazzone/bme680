'use strict';

const assert = require('chai').assert;
const rewire = require('rewire');
const Bme680 = rewire('../../lib/bme680');

describe('Bme680', function () {

    console.error = () => { };

    describe("constructor", function () {
        it('Check that input parameters are used', function () {

	    //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {};	
                }
            });


            //Act
            const bme680 = new Bme680(2, 0x77);

            //Assert
	    assert.equal(0x77,bme680.i2cAddress);	
	    assert.equal(2,deviceId);
            
        });

 it('Check that default input parameters are used', function () {

	    //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {};	
                }
            });


            //Act
            const bme680 = new Bme680();

            //Assert
	    assert.equal(0x76,bme680.i2cAddress);	
	    assert.equal(1,deviceId);
            
        });
    });
});