'use strict';

const assert = require('chai').assert;
const CalibrationData = require('../lib/calibrationData');

describe('CalibrationData', function () {

    console.error = () => { };

    describe("constructor", function () {
        it('Check that parameters are saved', function () {
            //Act
            const calibrationData = new CalibrationData();

            //Assert
            assert.isNull(calibrationData.par_h1);
            assert.isNull(calibrationData.par_h2);
            assert.isNull(calibrationData.par_h3);
            assert.isNull(calibrationData.par_h4);
            assert.isNull(calibrationData.par_h5);
            assert.isNull(calibrationData.par_h6);
            assert.isNull(calibrationData.par_h7);
            assert.isNull(calibrationData.par_gh1);
            assert.isNull(calibrationData.par_gh2);
            assert.isNull(calibrationData.par_gh3);
            assert.isNull(calibrationData.par_t1);
            assert.isNull(calibrationData.par_t2);
            assert.isNull(calibrationData.par_t3);
            assert.isNull(calibrationData.par_p1);
            assert.isNull(calibrationData.par_p2);
            assert.isNull(calibrationData.par_p3);
            assert.isNull(calibrationData.par_p4);
            assert.isNull(calibrationData.par_p5);
            assert.isNull(calibrationData.par_p6);
            assert.isNull(calibrationData.par_p7);
            assert.isNull(calibrationData.par_p8);
            assert.isNull(calibrationData.par_p9);
            assert.isNull(calibrationData.par_p10);
        });
    });

    describe("bytes_to_word", function () {
        it('Check that bytes to word conversion is ok (8 bits, signed false)', function () {
            // Act
            const wordResult = CalibrationData.bytes_to_word(0Xff, 0X57, 8, false);
            // Assert
            assert.equal(65367, wordResult);
        });

        it('Check that bytes to word conversion is ok (8 bits, signed true)', function () {
            // Act
            const wordResult = CalibrationData.bytes_to_word(0Xff, 0X57, 8, true);
            // Assert
            assert.equal(87, wordResult);
        });

        it('Check that bytes to word conversion is ok (16 bits, signed true)', function () {
            // Act
            const wordResult = CalibrationData.bytes_to_word(0Xff, 0X57, 16, true);
            // Assert
            assert.equal(-169, wordResult);
        });

        it('Check that bytes to word conversion is ok ()', function () {
            // Act
            const wordResult = CalibrationData.bytes_to_word(0Xff, 0X57);
            // Assert
            assert.equal(65367, wordResult);
        });

        it('Check that bytes to word conversion is throwing an exception (64 bits, signed true)', function () {
            // Act
            try {
                const wordResult = CalibrationData.bytes_to_word(0Xff, 0X57, 64, true);
            }
            catch (err) {
                // Assert
                assert.equal('uintToInt only supports ints up to 32 bits', err.message);
            }
        });
    });
});