'use strict';

const assert = require('chai').assert;
const rewire = require('rewire');
const Bme680 = rewire('../../lib/bme680');
const Constants = require('../../lib/constants');
const constants = new Constants();

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

describe('writeByte',function(){
it('Check that the value is set',async function(){


           let i2cAddressWire,cmdWire,byteWire;
  	   //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {
                writeByte: async function (i2cAddress,cmd,byte,callback){
                    i2cAddressWire = i2cAddress;
		    cmdWire = cmd;
		    byteWire=byte;
		    callback(null,{});
                }};                
            }});


const bme680 = new Bme680();

            //Act
await bme680.writeByte(0xe3,0xfe);

//Assert
assert.equal(0x76,i2cAddressWire);
assert.equal(0xe3,cmdWire);
assert.equal(0xfe,byteWire);     
});

it('Check that the error is correctly throwed',async function(){


           let i2cAddressWire,cmdWire,byteWire;
  	   //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {
                writeByte: async function (i2cAddress,cmd,byte,callback){
                    i2cAddressWire = i2cAddress;
		    cmdWire = cmd;
		    byteWire=byte;
		    callback(new Error('writeByte mocked error',null));
                }};                
            }});


const bme680 = new Bme680();

            //Act
try{
await bme680.writeByte(0xe3,0xfe);
}
catch(err){
assert.equal('writeByte mocked error',err.message);
}

//Assert
assert.equal(0x76,i2cAddressWire);
assert.equal(0xe3,cmdWire);
assert.equal(0xfe,byteWire);     
});
});

describe('readByte',function(){
it('Check that the value is read (length=1)',async function(){


           let i2cAddressWire,cmdWire,byteWire;
  	   //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {
                readByte: async function (i2cAddress,cmd,callback){
                    i2cAddressWire = i2cAddress;
		    cmdWire = cmd;
		    callback(null,0xa6);
                }};                
            }});


const bme680 = new Bme680();

            //Act
const result = await bme680.readByte(0xe3);

//Assert
assert.equal(0x76,i2cAddressWire);
assert.equal(0xe3,cmdWire);
assert.equal(0xa6,result);     
});

it('Check that the error is correctly throwed (length=1)',async function(){


           let i2cAddressWire,cmdWire,byteWire;
  	   //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {
                readByte: async function (i2cAddress,cmd,callback){
                    i2cAddressWire = i2cAddress;
		    cmdWire = cmd;
		    callback(new Error('readByte mocked error'),null);
                }};                
            }});


const bme680 = new Bme680();

            //Act
try{
await bme680.readByte(0xe3);
}
catch(err){
assert.equal('readByte mocked error',err.message);
}

//Assert
assert.equal(0x76,i2cAddressWire);
assert.equal(0xe3,cmdWire);
});

it('Check that the value is read (length>1)',async function(){


           let i2cAddressWire,cmdWire,byteWire,lengthWire;
  	   //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {
                readI2cBlock: async function (i2cAddress,cmd,length,buffer,callback){
                    i2cAddressWire = i2cAddress;
		    cmdWire = cmd;
		    lengthWire = length;
                    buffer.fill('0123456789');
		    callback(null,buffer);
                }};                
            }});


const bme680 = new Bme680();

            //Act
const result = await bme680.readByte(0xe3,10,Buffer.alloc(10));

//Assert
assert.equal(0x76,i2cAddressWire);
assert.equal(0xe3,cmdWire);
assert.equal(0,Buffer.from([0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39]).compare(result));     
});

it('Check that the error is correctly throwed (length>1)',async function(){


           let i2cAddressWire,cmdWire,byteWire,lengthWire;
  	   //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {
                readI2cBlock: async function (i2cAddress,cmd,length,buffer,callback){
                    i2cAddressWire = i2cAddress;
		    cmdWire = cmd;
		    lengthWire = length;
		    callback(new Error('readByte mocked error'),null);
                }};                
            }});


const bme680 = new Bme680();

            //Act
try{
await bme680.readByte(0xe3,10,Buffer.alloc(10));
}
catch(err){
assert.equal('readByte mocked error',err.message);
}

//Assert
assert.equal(0x76,i2cAddressWire);
assert.equal(0xe3,cmdWire);
});

});

describe('setBits',function(){
it('Check that the value is set',async function(){

  //Prepare
	    let deviceId;	
	    Bme680.__set__("i2c", {
                openSync: function (device){
                    deviceId = device;
        	    return {};	
                }
            });

let registerRead,lengthRead,registerWrite,valueWrite;

const bme680 = new Bme680();
bme680.readByte=(register,length)=>{
registerRead = register;
lengthRead = length;
};

bme680.writeByte = (register,value)=>{
registerWrite = register;
valueWrite = value;
};

            //Act
await bme680.setBits(constants.CONF_ODR_RUN_GAS_NBC_ADDR, constants.NBCONV_MSK, constants.NBCONV_POS,10);

//Assert
assert.equal(113,registerRead);
assert.equal(1,lengthRead);
assert.equal(113,registerWrite);
assert.equal(10,valueWrite);            

});
});
});