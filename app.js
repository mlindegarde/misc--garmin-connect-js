import { GarminClient } from './application/garmin-client.js';
import { InvalidGarminSession } from './application/garmin-session.js';

let session = await new GarminClient().beginSession("[your username]", "[your password]");

if (session !== InvalidGarminSession) {
    let weightData = await session.getWeightData('2021-09-18', '2022-09-18');
    console.log(weightData);
}