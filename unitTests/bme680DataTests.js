'use strict';

const assert = require('chai').assert;
const Bme680Data = require('../lib/bme680Data');

describe('bme680Data', function () {

    console.error = () => { };

    describe("constructor", function () {
        it('Check that parameters are saved', function () {
            //Act
            const bme680 = new Bme680Data();

            //Assert
            assert.isNull(bme680.chip_id);
            assert.isNull(bme680.dev_id);
            assert.isNull(bme680.intf);
            assert.isNull(bme680.mem_page);
            assert.isNull(bme680.ambient_temperature);
            assert.equal('FieldData',bme680.data.constructor.name);
            assert.equal('CalibrationData',bme680.calibration_data.constructor.name);
            assert.equal('TPHSettings',bme680.tph_settings.constructor.name);
            assert.equal('GasSettings',bme680.gas_settings.constructor.name);
            assert.isNull(bme680.power_mode);
            assert.isNull(bme680.new_fields);
        });
    });
});