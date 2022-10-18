import got from 'got';

class GarminSession {
    #WEIGHT_DATA_URL = 'https://connect.garmin.com/weight-service/weight/range';

    #cookieJar = undefined;
    #accessToken = undefined;
    #agent = undefined;

    get isAuthenticated() {
        return this.#accessToken !== undefined;
    }

    constructor(cookieJar, accessToken, agent) {
        this.#cookieJar = cookieJar;
        this.#accessToken = accessToken;
        this.#agent = agent;
    }

    async getWeightData(minDate, maxDate) {
        const url = `${this.#WEIGHT_DATA_URL}/${minDate}/${maxDate}?includeAll=true`;

        if (!this.isAuthenticated) {
            console.warn('This session is not authenticated, weight data cannot be retrieved');
            return {};
        }

        try {
            console.info(`Obtaining weight data between [${minDate}] and [${maxDate}]`);
            let weightDataResponse = await got.get(url, {
                agent: this.#agent,
                headers: {
                    'Authorization': `Bearer ${this.#accessToken}`,
                    'Accept': 'application/json, text/plain, */*',
                    'DI-Backend': 'connectapi.garmin.com',
                    'Origin': 'https://connect.garmin.com'
                },
                cookieJar: this.#cookieJar
            }).json();

            console.log('Successfully received the requested weight data:');
            return weightDataResponse;

        } catch (error) {
            console.error(`Failed to get weight data, maybe something here will tell you why [${error}]`);
            return {};
        }
    }
}

class GarminSessionBuilder {
    #cookieJar = undefined;
    #accessToken = undefined;
    #agent = undefined;

    withCookieJar(cookieJar) {
        this.#cookieJar = cookieJar;
        return this;
    }

    usingAccessToken(accessToken) {
        this.#accessToken = accessToken;
        return this;
    }

    usingProxyAgent(agent) {
        this.#agent = agent;
        return this;
    }

    build() {
        return new GarminSession(
            this.#cookieJar,
            this.#accessToken,
            this.#agent);
    }
}

const InvalidGarminSession = new GarminSessionBuilder()
    .build();

export { GarminSession, GarminSessionBuilder, InvalidGarminSession }