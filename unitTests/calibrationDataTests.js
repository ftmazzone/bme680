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

        it('Check that bytes to word conversion is ok (default)', function () {
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

  describe("twos_comp", function () {
	it("Check that the two's complement method is ok (default)",function(){
		//Act
		const twosCompResult = CalibrationData.twos_comp(0xfe);
		//Assert
		assert.equal(254,twosCompResult);
	});

	it(`Check that the two's complement method is ok (string instead of number)`,function(){
		//Act
		const twosCompResult = CalibrationData.twos_comp(0xfe,'p');
		//Assert
		assert.equal(254,twosCompResult);
	});
	});

  describe("setOther", function () {
	it('Check that the result is ok',function(){
		//Prepare
		const calibrationData =new CalibrationData();
		//Act
		calibrationData.setOther(22,47,3);
		//Assert
		assert.equal(1,calibrationData.res_heat_range);
		assert.equal(47,calibrationData.res_heat_val);
		assert.equal(0,calibrationData.range_sw_err);
	});
});

  describe("setFromArray", function () {
	it('Check that the result is ok',function(){
		//Prepare
		const calibrationData =new CalibrationData();
		const calibrationMock =[0x00, 0xdf, 0x67, 0x03, 0xef, 0xaa, 0x8d, 0x8a, 0xd7, 0x58, 0xff, 0x39, 0x19, 0xd7, 0xff, 0x2b, 0x1e, 0x00, 0x00, 0x4a, 0xf5, 0x02, 0xf6, 0x1e, 0x01, 0x3e, 0xc9, 0x32, 0x00, 0x2d, 0x14, 0x78, 0x9c, 0x18, 0x66, 0x93, 0xde, 0xdf, 0x12, 0x82, 0x00];
		//Act
		calibrationData.setFromArray(Buffer.from(calibrationMock));
console.log('calibrationData',calibrationData);
		//Assert
		   assert.equal(809,calibrationData.par_h1);
            assert.equal(1004,calibrationData.par_h2);
            assert.equal(0,calibrationData.par_h3);
            assert.equal(45,calibrationData.par_h4);
            assert.equal(20,calibrationData.par_h5);
            assert.equal(120,calibrationData.par_h6);
            assert.equal(-100,calibrationData.par_h7);
            assert.equal(-33,calibrationData.par_gh1);
            assert.equal(-8557,calibrationData.par_gh2);
            assert.equal(18,calibrationData.par_gh3);
            assert.equal(26136,calibrationData.par_t1);
            assert.equal(26591,calibrationData.par_t2);
            assert.equal(3,calibrationData.par_t3);
            assert.equal(36266,calibrationData.par_p1);
            assert.equal(-10358,calibrationData.par_p2);
            assert.equal(88,calibrationData.par_p3);
            assert.equal(6457,calibrationData.par_p4);
            assert.equal(-41,calibrationData.par_p5);
            assert.equal(30,calibrationData.par_p6);
            assert.equal(43,calibrationData.par_p7);
            assert.equal(-2742,calibrationData.par_p8);
            assert.equal(-2558,calibrationData.par_p9);
            assert.equal(30,calibrationData.par_p10);
            assert.isNull(calibrationData.t_fine);
	    assert.isNull(calibrationData.res_heat_range);
	    assert.isNull(calibrationData.res_heat_val);	
	    assert.isNull(calibrationData.range_sw_err);		
	});
});

});