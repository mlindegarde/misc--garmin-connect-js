import fs from 'fs/promises';

import { GarminClient } from './application/garmin-client.js';
import { InvalidGarminSession } from './application/garmin-session.js';
import { GarminDataProcessor } from './application/garmin-data-processor.js';
import { MS_IN_A_YEAR } from './config/constants.js';

import * as Convert from './utilities/convert.js';

async function loadCredentials() {
    const rawData = await fs.readFile('config/credentials.json');
    return JSON.parse(rawData);
}

function getDateRange() {
    const now = new Date();
    const aYearAgo = new Date(now.getTime()-MS_IN_A_YEAR);

    return ({
        startDate: Convert.dateToString(aYearAgo),
        endDate: Convert.dateToString(now)
    });
}

(async () => {
    const credentials = await loadCredentials();
    const session = await new GarminClient().beginSession(credentials.username, credentials.password);
    const dateRange = getDateRange();

    if (session === InvalidGarminSession) {
        console.error("Well, that didn't work");
    }
    
    const dataProcessor = new GarminDataProcessor();
    const garminWeightData = await session.getWeightData(dateRange.startDate, dateRange.endDate);
    const weightData = dataProcessor.convertWeightDataToModel(garminWeightData);

    console.log(JSON.stringify(weightData));
})();