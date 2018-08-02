'use strict';

const { Bme680 } = require('../lib');
const bme680 = new Bme680(1, 0x76);

bme680.initialize().then(async () => {
    console.info('Sensor initialized');
    setInterval(async () => {
        console.info(await bme680.getSensorData());
    }, 3000);
});

