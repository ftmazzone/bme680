'use strict';

const i2c = require('i2c');
const Constants = require('./constants');
const Bme680Data = require('./bme680Data');
const CalibrationData = require('./calibrationData');
const constants = new Constants();
const bme680Data = new Bme680Data();

let wire;

module.exports = class Bme680 {

    constructor(device, i2cAddress) {
        if (!device) {
            device = '/dev/i2c-1';
        }
        if (!i2cAddress) {
            i2cAddress = constants.I2C_ADDR_PRIMARY;
        }
        wire = new i2c(i2cAddress, { device });
    }

    async  initialize() {
        this.chip_id = await this.readByte(constants.CHIP_ID_ADDR, 1);
        if (this.chip_id != constants.CHIP_ID) {
            const invalidChipIdError = `BME680 Not Found. Invalid CHIP ID: ${this.chip_id.toString(16)}`;
            console.error(invalidChipIdError);
            throw new Error(invalidChipIdError);
        }
        await this.softReset();
        await this.setPowerMode(constants.SLEEP_MODE);
        await this.getCalibrationData();
        await this.setHumidityOversample(constants.OS_2X);
        await this.setPressureOversample(constants.OS_4X);
        await this.setTemperatureOversample(constants.OS_8X);
        await this.setFilter(constants.FILTER_SIZE_3);
        await this.setGasStatus(constants.ENABLE_GAS_MEAS);
        await this.setTempOffset(0);

        await this.getSensorData();

        await this.setGasHeaterTemperature(320);
        await this.setGasHeaterDuration(150);
        await this.selectGasHeaterProfile(0);
    }

    async getSensorData() {

        await this.setPowerMode(constants.FORCED_MODE);
        for (let i = 0; i < 1000; i++) {
            const status = await this.readByte(constants.FIELD0_ADDR, 1);

            if ((status & constants.NEW_DATA_MSK) === 0) {

                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, constants.POLL_PERIOD_MS);
                });
                continue;
            }

            if (status & constants.NEW_DATA_MSK) {
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, constants.POLL_PERIOD_MS);
                })
            }

            let regs = await this.readByte(constants.FIELD0_ADDR, constants.FIELD_LENGTH);

            bme680Data.data.status = regs[0] & constants.NEW_DATA_MSK;
            // Contains the nb_profile used to obtain the current measurement
            bme680Data.data.gas_index = regs[0] & constants.GAS_INDEX_MSK;
            bme680Data.data.meas_index = regs[1];

            const adc_pres = (regs[2] << 12) | (regs[3] << 4) | (regs[4] >> 4);
            const adc_temp = (regs[5] << 12) | (regs[6] << 4) | (regs[7] >> 4);
            const adc_hum = (regs[8] << 8) | regs[9];
            const adc_gas_res = (regs[13] << 2) | (regs[14] >> 6);
            const gas_range = regs[14] & constants.GAS_RANGE_MSK;

            bme680Data.data.status |= regs[14] & constants.GASM_VALID_MSK;
            bme680Data.data.status |= regs[14] & constants.HEAT_STAB_MSK;

            bme680Data.data.heat_stable = (bme680Data.data.status & constants.HEAT_STAB_MSK) > 0;

            let temperature = await this.calcTemperature(adc_temp);
            bme680Data.data.temperature = temperature / 100.0;
            this.ambient_temperature = temperature;// Saved for heater calc;

            bme680Data.data.pressure = await this.calcPressure(adc_pres) / 100.0;
            bme680Data.data.humidity = await this.calcHumidity(adc_hum) / 1000.0;
            bme680Data.data.gas_resistance = await this.calcGasResistance(adc_gas_res, gas_range);
            return bme680Data;
        }
        return null;
    }


    async setGasHeaterDuration(value, nb_profile = 0) {
        if (nb_profile > constants.NBCONV_MAX || value < constants.NBCONV_MIN) {
            throw new Error(`Profile '${nb_profile}' should be between ${constants.NBCONV_MIN} and ${constants.NBCONV_MAX}`);
        }
        bme680Data.gas_settings.heatr_dur = value;
        let temp = this.calcHeaterDuration(bme680Data.gas_settings.heatr_dur);
        await this.writeByte(constants.GAS_WAIT0_ADDR + nb_profile, temp);
    }

    async selectGasHeaterProfile(value) {
        if (value > constants.NBCONV_MAX || value < constants.NBCONV_MIN) {
            throw new Error(`Profile '${value}' should be between ${constants.NBCONV_MIN} and ${constants.NBCONV_MAX}`);
        }
        bme680Data.gas_settings.nb_conv = value
        await this.setBits(constants.CONF_ODR_RUN_GAS_NBC_ADDR, constants.NBCONV_MSK, constants.NBCONV_POS, value);
    }

    calcHeaterDuration(duration) {
        if (duration < 0xfc0) {
            let factor = 0

            while (duration > 0x3f) {
                duration /= 4
                factor += 1
            }

            return Number.parseInt(duration + (factor * 64));
        }
        return 0xff;
    }

    async setGasHeaterTemperature(value, nb_profile = 0) {

        if (nb_profile > constants.NBCONV_MAX || value < constants.NBCONV_MIN) {
            throw new Error(`Profile '${nb_profile}' should be between ${constants.NBCONV_MIN} and ${constants.NBCONV_MAX}`);
        }

        bme680Data.gas_settings.heatr_temp = value;
        let temp = Number.parseInt(this.calcHeaterResistance(bme680Data.gas_settings.heatr_temp));
        await this.writeByte(constants.RES_HEAT0_ADDR + nb_profile, temp);
    }

    async  calcGasResistance(gas_res_adc, gas_range) {
        let var1 = (1340.0 + (5.0 * this.calibrationData.range_sw_err));
        let var2 = (var1) * (1.0 + constants.lookupTable1[gas_range] / 100.0);
        let var3 = 1.0 + (constants.lookupTable2[gas_range] / 100.0);

        let calc_gas_res = 1.0 / (var3 * (0.000000125) * (1 << gas_range) * ((((gas_res_adc) - 512.0) / var2) + 1.0));

        return calc_gas_res;
    }

    calcHeaterResistance(temperature) {
        temperature = Math.min(Math.max(temperature, 200), 400);
        let var1 = ((this.ambient_temperature * this.calibrationData.par_gh3) / 1000) * 256;
        let var2 = (this.calibrationData.par_gh1 + 784) * (((((this.calibrationData.par_gh2 + 154009) * temperature * 5) / 100) + 3276800) / 10);
        let var3 = var1 + (var2 / 2);
        let var4 = (var3 / (this.calibrationData.res_heat_range + 4));
        let var5 = (131 * this.calibrationData.res_heat_val) + 65536;
        let heatr_res_x100 = (((var4 / var5) - 250) * 34);
        let heatr_res = ((heatr_res_x100 + 50) / 100);
        return heatr_res;
    }

    async calcHumidity(humidity_adc) {
        let temp_scaled = ((this.calibrationData.t_fine * 5) + 128) >> 8;
        let var1 = (humidity_adc - ((this.calibrationData.par_h1 * 16))) - (Math.floor((temp_scaled * this.calibrationData.par_h3) / (100)) >> 1);
        let var2 = (this.calibrationData.par_h2 * (Math.floor((temp_scaled * this.calibrationData.par_h4) / (100))
            + Math.floor(((temp_scaled * Math.floor((temp_scaled * this.calibrationData.par_h5) / (100))) >> 6) / (100)) + (1 * 16384))) >> 10
        let var3 = var1 * var2
        let var4 = this.calibrationData.par_h6 << 7
        var4 = Math.floor((var4) + ((temp_scaled * this.calibrationData.par_h7) / (100))) >> 4
        let var5 = ((var3 >> 14) * (var3 >> 14)) >> 10
        let var6 = (var4 * var5) >> 1
        let calc_hum = (((var3 + var6) >> 10) * (1000)) >> 12

        return Math.min(Math.max(calc_hum, 0), 100000)
    }

    async calcPressure(pressure_adc) {
        let var1 = ((this.calibrationData.t_fine) >> 1) - 64000;
        let var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * this.calibrationData.par_p6) >> 2;
        var2 = var2 + ((var1 * this.calibrationData.par_p5) << 1);
        var2 = (var2 >> 2) + (this.calibrationData.par_p4 << 16);
        var1 = (((((var1 >> 2) * (var1 >> 2)) >> 13) *
            ((this.calibrationData.par_p3 << 5)) >> 3) +
            ((this.calibrationData.par_p2 * var1) >> 1));
        var1 = var1 >> 18;

        var1 = ((32768 + var1) * this.calibrationData.par_p1) >> 15;
        let calc_pressure = 1048576 - pressure_adc;
        calc_pressure = ((calc_pressure - (var2 >> 12)) * (3125));

        if (calc_pressure >= (1 << 31)) {
            calc_pressure = (Math.floor(calc_pressure / var1) << 1);
        }
        else {
            calc_pressure = Math.floor((calc_pressure << 1) / var1);
        }

        var1 = (this.calibrationData.par_p9 * (((calc_pressure >> 3) * (calc_pressure >> 3)) >> 13)) >> 12;
        var2 = ((calc_pressure >> 2) * this.calibrationData.par_p8) >> 13;

        let var3 = ((calc_pressure >> 8) * (calc_pressure >> 8) * (calc_pressure >> 8) * this.calibrationData.par_p10) >> 17;

        calc_pressure = (calc_pressure) + ((var1 + var2 + var3 + (this.calibrationData.par_p7 << 7)) >> 4);

        return calc_pressure;
    }

    async calcTemperature(temperature_adc) {
        const var1 = (temperature_adc >> 3) - (this.calibrationData.par_t1 << 1);
        const var2 = (var1 * this.calibrationData.par_t2) >> 11;
        let var3 = ((var1 >> 1) * (var1 >> 1)) >> 12;
        var3 = ((var3) * (this.calibrationData.par_t3 << 4)) >> 14;

        // Save teperature data for pressure calculations
        this.calibrationData.t_fine = (var2 + var3) + this.offset_temp_in_t_fine;
        const calc_temp = (((this.calibrationData.t_fine * 5) + 128) >> 8);

        return calc_temp;
    }

    async setTempOffset(value) {
        if (value === 0) {
            this.offset_temp_in_t_fine = 0;
        }
        else {
            this.offset_temp_in_t_fine = int((((int(abs(value) * 100)) << 8) - 128) / 5, value);
            if (value < 0) {
                this.offset_temp_in_t_fine = - this.offset_temp_in_t_fine;
            }
        }
    }

    async setGasStatus(value) {
        bme680Data.gas_settings.run_gas = value
        await this.setBits(constants.CONF_ODR_RUN_GAS_NBC_ADDR, constants.RUN_GAS_MSK, constants.RUN_GAS_POS, value);
    }

    async setFilter(value) {
        bme680Data.tph_settings.filter = value
        await this.setBits(constants.CONF_ODR_FILT_ADDR, constants.FILTER_MSK, constants.FILTER_POS, value)
    }

    async setHumidityOversample(value) {
        bme680Data.tph_settings.os_hum = value;
        await this.setBits(constants.CONF_OS_H_ADDR, constants.OSH_MSK, constants.OSH_POS, value);
    }

    async setPressureOversample(value) {
        bme680Data.tph_settings.os_pres = value
        await this.setBits(constants.CONF_T_P_MODE_ADDR, constants.OSP_MSK, constants.OSP_POS, value);
    }

    async setTemperatureOversample(value) {
        bme680Data.tph_settings.os_temp = value
        await this.setBits(constants.CONF_T_P_MODE_ADDR, constants.OST_MSK, constants.OST_POS, value);
    }

    async getTemperatureOversample() {
        return await this.readByte(constants.CONF_T_P_MODE_ADDR);
    }

	/**
	 * Retrieves the sensor calibration data and stores it in .calibration_data
	 */
    async getCalibrationData() {
        this.calibrationData = new CalibrationData();
        let calibration = Buffer.concat(
            [await this.readByte(constants.COEFF_ADDR1, constants.COEFF_ADDR1_LEN),
            await this.readByte(constants.COEFF_ADDR2, constants.COEFF_ADDR2_LEN)]
        );
        let heat_range = await this.readByte(constants.ADDR_RES_HEAT_RANGE_ADDR, 1);
        let heat_value = CalibrationData.twos_comp(await this.readByte(constants.ADDR_RES_HEAT_VAL_ADDR, 1), 8);
        let sw_error = CalibrationData.twos_comp(await this.readByte(constants.ADDR_RANGE_SW_ERR_ADDR, 1), 8);

        this.calibrationData.setFromArray(calibration);
        this.calibrationData.setOther(heat_range, heat_value, sw_error);
    }

	/**
	 * Initiate a soft reset
	 */
    async	softReset() {
        await this.writeByte(constants.SOFT_RESET_ADDR, constants.SOFT_RESET_CMD)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, constants.RESET_PERIOD);
        });
    }

	/**
	 * Get power mode
	 */
    async getPowerMode() {
        return await this.readByte(constants.CONF_T_P_MODE_ADDR, 1);
    }

	/**
	 * Set power mode
	 * @param {*} value 
	 * @param {*} blocking 
	 */
    async setPowerMode(value, blocking = false) {
        if (value !== constants.SLEEP_MODE && value !== constants.FORCED_MODE) {
            throw new Error("Power mode should be one of SLEEP_MODE or FORCED_MODE");
        }

        this.power_mode = value;
        await this.setBits(constants.CONF_T_P_MODE_ADDR, constants.MODE_MSK, constants.MODE_POS, value);
        return new Promise((resolve, reject) => {
            let cpt = 0;
            const intervalPowerModeSwitch = setInterval(async () => {
                const currentPowerMode = await this.getPowerMode();
                if (!blocking || currentPowerMode === this.power_mode) {
                    clearInterval(intervalPowerModeSwitch);
                    resolve(this.power_mode);
                }
                if (cpt++ > 10000) {
                    clearInterval(intervalPowerModeSwitch);
                    reject(`Power mode could not be updated after a delay of ${cpt * constants.POLL_PERIOD_MS / 1000} ms`);
                }
            }, constants.POLL_PERIOD_MS / 1000)
        });
    }

    async  writeByte(cmd, byte) {
        return new Promise((resolve, reject) => {
            wire.writeBytes(cmd, [byte], function (err) {
                if (err) {
                    reject(err);
                }
                resolve();
            })
        });
    }

    async  readByte(cmd, length) {
        return new Promise((resolve, reject) => {
            if (!length) {
                length = 1;
            }
            wire.readBytes(cmd, length, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve((length === 1) ? data[0] : data);
            });
        });
    }

    async setBits(register, mask, position, value) {
        let temp = await this.readByte(register, 1);
        temp &= ~mask;
        temp |= value << position;
        await this.writeByte(register, temp);
    }
}