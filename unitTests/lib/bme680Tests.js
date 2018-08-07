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
                openSync: function (device) {
                    deviceId = device;
                    return {};
                }
            });

            //Act
            const bme680 = new Bme680(2, 0x77);

            //Assert
            assert.equal(0x77, bme680.i2cAddress);
            assert.equal(2, deviceId);

        });

        it('Check that default input parameters are used', function () {

            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {};
                }
            });

            //Act
            const bme680 = new Bme680();

            //Assert
            assert.equal(0x76, bme680.i2cAddress);
            assert.equal(1, deviceId);

        });
    });

    describe('writeByte', function () {
        it('Check that the value is set', async function () {


            let i2cAddressWire, cmdWire, byteWire;
            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {
                        writeByte: async function (i2cAddress, cmd, byte, callback) {
                            i2cAddressWire = i2cAddress;
                            cmdWire = cmd;
                            byteWire = byte;
                            callback(null, {});
                        }
                    };
                }
            });


            const bme680 = new Bme680();

            //Act
            await bme680.writeByte(0xe3, 0xfe);

            //Assert
            assert.equal(0x76, i2cAddressWire);
            assert.equal(0xe3, cmdWire);
            assert.equal(0xfe, byteWire);
        });

        it('Check that the error is correctly throwed', async function () {


            let i2cAddressWire, cmdWire, byteWire;
            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {
                        writeByte: async function (i2cAddress, cmd, byte, callback) {
                            i2cAddressWire = i2cAddress;
                            cmdWire = cmd;
                            byteWire = byte;
                            callback(new Error('writeByte mocked error', null));
                        }
                    };
                }
            });


            const bme680 = new Bme680();

            //Act
            try {
                await bme680.writeByte(0xe3, 0xfe);
            }
            catch (err) {
                assert.equal('writeByte mocked error', err.message);
            }

            //Assert
            assert.equal(0x76, i2cAddressWire);
            assert.equal(0xe3, cmdWire);
            assert.equal(0xfe, byteWire);
        });
    });

    describe('initialize', function () {
        it('Check that all initialization methods are called', async function () {
            // Prepare
            let chipIdAddressRead, lengthRead, softResetTriggered, powerModeSet, calibrationDataGet;
            let humidityOversampleSet, pressureOversampleSet, temperatureOversampleSet, filterSet;
            let gasStatusSet, tempOffsetSet, sensorDataGet, gasHeaterTemperatureSet, gasHeaterDurationSet, gasHeaterProfileSelected;


            Bme680.__set__("i2c", {
                openSync: function () {
                    return {};
                }
            });
            const bme680 = new Bme680();

            bme680.readByte = async function (chipIdAddress, length) {
                chipIdAddressRead = chipIdAddress;
                lengthRead = length;
                return constants.CHIP_ID;
            };
            bme680.softReset = async () => {
                softResetTriggered = true;
                return {};
            };
            bme680.setPowerMode = async (powerMode) => {
                powerModeSet = powerMode;
            };
            bme680.getCalibrationData = async () => {
                calibrationDataGet = true;
            };
            bme680.setHumidityOversample = async (humidityOversample) => {
                humidityOversampleSet = humidityOversample;
            };
            bme680.setPressureOversample = async (pressureOversample) => {
                pressureOversampleSet = pressureOversample;
            };
            bme680.setTemperatureOversample = async (temperatureOversample) => {
                temperatureOversampleSet = temperatureOversample;
            };
            bme680.setFilter = async (filter) => {
                filterSet = filter;
            };
            bme680.setGasStatus = async (gasStatus) => {
                gasStatusSet = gasStatus;
            };
            bme680.setTempOffset = async (tempOffset) => {
                tempOffsetSet = tempOffset;
            };
            bme680.getSensorData = async () => {
                sensorDataGet = true;
            };
            bme680.setGasHeaterTemperature = async (gasHeaterTemperature) => {
                gasHeaterTemperatureSet = gasHeaterTemperature;
            };
            bme680.setGasHeaterDuration = async (gasHeaterDuration) => {
                gasHeaterDurationSet = gasHeaterDuration;
            };
            bme680.selectGasHeaterProfile = async (gasHeaterProfile) => {
                gasHeaterProfileSelected = gasHeaterProfile;
            };

            // Act
            await bme680.initialize();

            // Assert
            assert.equal(constants.CHIP_ID_ADDR, chipIdAddressRead);
            assert.equal(1, lengthRead);
            assert.isTrue(softResetTriggered);
            assert.equal(constants.SLEEP_MODE, powerModeSet);
            assert.isTrue(calibrationDataGet);
            assert.equal(constants.OS_2X, humidityOversampleSet);
            assert.equal(constants.OS_4X, pressureOversampleSet);
            assert.equal(constants.OS_8X, temperatureOversampleSet);
            assert.equal(constants.FILTER_SIZE_3, filterSet);
            assert.equal(constants.ENABLE_GAS_MEAS, gasStatusSet);
            assert.equal(0, tempOffsetSet);
            assert.isTrue(sensorDataGet);
            assert.equal(320, gasHeaterTemperatureSet);
            assert.equal(150, gasHeaterDurationSet);
            assert.equal(0, gasHeaterProfileSelected);

        });

        it('Check that the chip id is validated', async function () {
            // Prepare
            let chipIdAddressRead, lengthRead;


            Bme680.__set__("i2c", {
                openSync: function () {
                    return {};
                }
            });
            const bme680 = new Bme680();

            bme680.readByte = async function (chipIdAddress, length) {
                chipIdAddressRead = chipIdAddress;
                lengthRead = length;
                return 0x00;
            };

            // Act
            try {
                await bme680.initialize();
            }
            catch (err) {
                // Assert
                assert.equal(constants.CHIP_ID_ADDR, chipIdAddressRead);
                assert.equal(1, lengthRead);
                assert.equal('BME680 Not Found. Invalid CHIP ID: 0',err.message);
            }
        });
    });

    describe('readByte', function () {
        it('Check that the value is read (length=1)', async function () {


            let i2cAddressWire, cmdWire, byteWire;
            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {
                        readByte: async function (i2cAddress, cmd, callback) {
                            i2cAddressWire = i2cAddress;
                            cmdWire = cmd;
                            callback(null, 0xa6);
                        }
                    };
                }
            });


            const bme680 = new Bme680();

            //Act
            const result = await bme680.readByte(0xe3);

            //Assert
            assert.equal(0x76, i2cAddressWire);
            assert.equal(0xe3, cmdWire);
            assert.equal(0xa6, result);
        });

        it('Check that the error is correctly throwed (length=1)', async function () {


            let i2cAddressWire, cmdWire, byteWire;
            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {
                        readByte: async function (i2cAddress, cmd, callback) {
                            i2cAddressWire = i2cAddress;
                            cmdWire = cmd;
                            callback(new Error('readByte mocked error'), null);
                        }
                    };
                }
            });


            const bme680 = new Bme680();

            //Act
            try {
                await bme680.readByte(0xe3);
            }
            catch (err) {
                assert.equal('readByte mocked error', err.message);
            }

            //Assert
            assert.equal(0x76, i2cAddressWire);
            assert.equal(0xe3, cmdWire);
        });

        it('Check that the value is read (length>1)', async function () {


            let i2cAddressWire, cmdWire, byteWire, lengthWire;
            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {
                        readI2cBlock: async function (i2cAddress, cmd, length, buffer, callback) {
                            i2cAddressWire = i2cAddress;
                            cmdWire = cmd;
                            lengthWire = length;
                            buffer.fill('0123456789');
                            callback(null, buffer);
                        }
                    };
                }
            });


            const bme680 = new Bme680();

            //Act
            const result = await bme680.readByte(0xe3, 10, Buffer.alloc(10));

            //Assert
            assert.equal(0x76, i2cAddressWire);
            assert.equal(0xe3, cmdWire);
            assert.equal(0, Buffer.from([0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]).compare(result));
        });

        it('Check that the error is correctly throwed (length>1)', async function () {


            let i2cAddressWire, cmdWire, byteWire, lengthWire;
            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {
                        readI2cBlock: async function (i2cAddress, cmd, length, buffer, callback) {
                            i2cAddressWire = i2cAddress;
                            cmdWire = cmd;
                            lengthWire = length;
                            callback(new Error('readByte mocked error'), null);
                        }
                    };
                }
            });


            const bme680 = new Bme680();

            //Act
            try {
                await bme680.readByte(0xe3, 10, Buffer.alloc(10));
            }
            catch (err) {
                assert.equal('readByte mocked error', err.message);
            }

            //Assert
            assert.equal(0x76, i2cAddressWire);
            assert.equal(0xe3, cmdWire);
        });

    });

    describe('setBits', function () {
        it('Check that the value is set', async function () {

            //Prepare
            let deviceId;
            Bme680.__set__("i2c", {
                openSync: function (device) {
                    deviceId = device;
                    return {};
                }
            });

            let registerRead, lengthRead, registerWrite, valueWrite;

            const bme680 = new Bme680();
            bme680.readByte = (register, length) => {
                registerRead = register;
                lengthRead = length;
            };

            bme680.writeByte = (register, value) => {
                registerWrite = register;
                valueWrite = value;
            };

            //Act
            await bme680.setBits(constants.CONF_ODR_RUN_GAS_NBC_ADDR, constants.NBCONV_MSK, constants.NBCONV_POS, 10);

            //Assert
            assert.equal(113, registerRead);
            assert.equal(1, lengthRead);
            assert.equal(113, registerWrite);
            assert.equal(10, valueWrite);

        });
    });
});