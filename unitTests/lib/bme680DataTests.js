'use strict';

const assert = require('chai').assert;
const Bme680Data = require('../../lib/bme680Data');
const Constants = require('../../lib/constants');
const constants = new Constants();

describe('bme680Data', function () {

    describe('constructor', function () {
        it('Check that parameters are saved', function () {
            //Act
            const bme680Data = new Bme680Data();

            //Assert
            assert.isNull(bme680Data.chip_id);
            assert.isNull(bme680Data.dev_id);
            assert.isNull(bme680Data.intf);
            assert.isNull(bme680Data.mem_page);
            assert.isNull(bme680Data.ambient_temperature);
            assert.equal('FieldData', bme680Data.data.constructor.name);
            assert.equal('CalibrationData', bme680Data.calibration_data.constructor.name);
            assert.equal('TPHSettings', bme680Data.tph_settings.constructor.name);
            assert.equal('GasSettings', bme680Data.gas_settings.constructor.name);
            assert.isNull(bme680Data.power_mode);
            assert.isNull(bme680Data.new_fields);
        });
    });

    describe('chip_name', function () {
        it('bme680', function () {
            // Prepare
            const bme680Data = new Bme680Data();
            bme680Data.chip_variant = constants.VARIANT_LOW;

            // Act
            const result = bme680Data.chip_name;

            // Assert
            assert.equal(result, 'bme680')
        });

        it('bme688', function () {
            // Prepare
            const bme680Data = new Bme680Data();
            bme680Data.chip_variant = constants.VARIANT_HIGH;

            // Act
            const result = bme680Data.chip_name;

            // Assert
            assert.equal(result, 'bme688')
        });
    });
});