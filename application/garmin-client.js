import got from 'got';
import { HttpsProxyAgent } from 'hpagent';
import { CookieJar } from 'tough-cookie';
import { GarminSessionBuilder, InvalidGarminSession } from './garmin-session.js';

class GarminClient {
    #QUERY_STRING = "service=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&webhost=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&source=https%3A%2F%2Fconnect.garmin.com%2Fsignin%2F&redirectAfterAccountLoginUrl=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&redirectAfterAccountCreationUrl=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F&gauthHost=https%3A%2F%2Fsso.garmin.com%2Fsso&locale=en_US&id=gauth-widget&cssUrl=https%3A%2F%2Fconnect.garmin.com%2Fgauth-custom-v1.2-min.css&privacyStatementUrl=https%3A%2F%2Fwww.garmin.com%2Fen-US%2Fprivacy%2Fconnect%2F&clientId=GarminConnect&rememberMeShown=true&rememberMeChecked=false&createAccountShown=true&openCreateAccount=false&displayNameShown=false&consumeServiceTicket=false&initialFocus=true&embedWidget=false&socialEnabled=false&generateExtraServiceTicket=true&generateTwoExtraServiceTickets=true&generateNoServiceTicket=false&globalOptInShown=true&globalOptInChecked=false&mobile=false&connectLegalTerms=true&showTermsOfUse=false&showPrivacyPolicy=false&showConnectLegalAge=false&locationPromptShown=true&showPassword=true&useCustomHeader=false&mfaRequired=false&performMFACheck=false&rememberMyBrowserShown=true&rememberMyBrowserChecked=false";
    #SSO_URL = `https://sso.garmin.com/sso/signin?${this.#QUERY_STRING}`;
    #TOKEN_URL = 'https://connect.garmin.com/modern/di-oauth/exchange';
    #PROXY = 'http://127.0.0.1:8888';
    #USER_AGENT = 'Chrome/79';
    //#USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36';

    #ticketUrlRegex = /response_url\s*=\s*"(?<ticketUrl>https:[^"]+)"/;

    async beginSession(username, password) {
        let agent = this.#createAgent();
        let cookieJar = new CookieJar();

        console.info(`Authenticating using username [${username}] and password [${password}]`);
        const { authSuccess, authTicketUrl } = await this.#authenticate(agent, username, password, cookieJar);

        if (!authSuccess) {
            console.warn('Failed to authenticate, Cloudflare wins again...');
            return InvalidGarminSession;
        }

        console.info(`Successfully authenticated, obtaining auth ticket from [${authTicketUrl}]`);
        const { ticketSuccess, } = await this.#getTicket(agent, authTicketUrl, cookieJar);

        if (!ticketSuccess) {
            console.warn('Failed to get the requird ticket, returning an invalid session');
            return InvalidGarminSession;
        }

        console.info('Successfully obtained the ticket related cookies, getting OAuth tokens...');
        const { tokenSuccess, accessToken } = await this.#getAccessToken(agent, cookieJar);

        if (!tokenSuccess) {
            console.warn('Failed to get OAuth tokens, so close but so far...');
            return InvalidGarminSession;
        }

        console.info('Successfully authenticated, returning session');
        return new GarminSessionBuilder()
            .usingAccessToken(accessToken)
            .withCookieJar(cookieJar)
            .usingProxyAgent(agent)
            .build();
    }

    async #authenticate(agent, username, password, cookieJar) {
        try {
            let response = await got.post(this.#SSO_URL, {
                agent: agent,
                headers: {
                    'Host': 'sso.garmin.com',
                    'User-Agent': this.#USER_AGENT,
                    'authority': 'sso.garmin.com',
                    'Origin': 'https://sso.garmin.com'
                },
                form: {
                    username: username,
                    password: password,
                    embed: false
                },
                cookieJar: cookieJar
            }).text();

            return ({
                authSuccess: true,
                authTicketUrl: response
                    .match(this.#ticketUrlRegex).groups.ticketUrl
                    .replace(/(\\\/)/g, "/")
            });
        } catch (error) {
            return ({
                authSuccess: false
            });
        }
    }

    // agent is not required here
    async #getTicket(agent, ticketUrl, cookieJar) {
        try {
            let response = await got.get(ticketUrl, {
                agent: agent,
                cookieJar: cookieJar
            }).text();

            return ({
                ticketSuccess: true,
                ticketResponse: response
            });
        } catch (error) {
            return ({
                ticketSuccess: false
            });
        }
    }

    // agent is not required here
    async #getAccessToken(agent, cookieJar) {
        try {
            let tokenResponse = await got.post(this.#TOKEN_URL, {
                agent: agent,
                headers: {
                    'Host': 'connect.garmin.com',
                    'User-Agent': this.#USER_AGENT,
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://connect.garmin.com'
                },
                json: undefined,
                cookieJar: cookieJar
            }).json();

            return ({
                tokenSuccess: true,
                accessToken: tokenResponse.access_token
            });
        } catch (error) {
            return ({
                authSuccess: false
            });
        }
    }

    #createAgent() {
        return {
            https: new HttpsProxyAgent({
                keepAlive: true,
                proxy: this.#PROXY,
                proxyConnectOptions: {
                    headers: {
                        'User-Agent': this.#USER_AGENT
                    },
                    keepAlive: true,
                }
            })
        };
    }
}

export { GarminClient };