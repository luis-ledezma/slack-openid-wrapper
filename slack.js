'use strict';

const request = require('request-promise');

const {
    SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET,
    COGNITO_REDIRECT_URI
  } = require('./config');

const getAuthorizeUrl = (client_id, scope, state, response_type) => {
    scope.split('openid').join('');
    return `https://slack.com/oauth/authorize?client_id=${client_id}&scope=${encodeURIComponent(
      scope
    )}&state=${state}&response_type=${response_type}`;
};

const getToken = (code, state) => {
    console.log("Getting Token from Slack...");
    console.log(code);
    state = (state) ? '&state=' + state : "";

    const oauthURL = 'https://slack.com/api/oauth.access?' + 
        'client_id=' + SLACK_CLIENT_ID + '&' +
        'client_secret=' + SLACK_CLIENT_SECRET + '&' +
        'grant_type=authorization_code' + '&' +
        'code=' + code +
        state;

    console.log(oauthURL);

    const options = {
        url: oauthURL,
        json: true
    };

    return request(options);
};

const getUserInfo = (access_token, user_id) => {
    console.log("Getting User Info from Slack...");

    const oauthURL = 'https://slack.com/api/users.info?' + 
        'token=' + access_token + '&' +
        'user=' + user_id;

    console.log(oauthURL);

    const options = {
        url: oauthURL,
        json: true
    };

    return request(options);
};

module.exports = {
    getAuthorizeUrl: getAuthorizeUrl,
    getToken: getToken,
    getUserInfo: getUserInfo
}