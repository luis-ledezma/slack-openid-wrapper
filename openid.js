const crypto = require('./crypto');
const slack = require('./slack');

const getJwks = () => ({ keys: [crypto.getPublicKey()] });

const getUserInfo = (accessToken, userID) =>
  slack
    .getUserInfo(accessToken, userID)
    .then(userDetails => {
      console.log('Fetched user details: %j', userDetails, {});
      // Here we map the slack user response to the standard claims from
      // OpenID. The mapping was constructed by following
      // and http://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
      const claims = {
        sub: `${userDetails.user.id}`, // OpenID requires a string
        name: userDetails.user.real_name,
        preferred_username: userDetails.user.name,
        email: userDetails.user.profile.email,
        phone: userDetails.user.profile.phone,
        picture: userDetails.user.profile.image_512,
        updated_at: userDetails.user.updated,
        team: userDetails.user.team,
        website: userDetails.user.team,
        given_name: userDetails.user.first_name,
        family_name: userDetails.user.last_name
      };
      console.log('Resolved claims: %j', claims, {});
      return claims;
    });

const getAuthorizeUrl = (client_id, scope, state, response_type) =>
  slack.getAuthorizeUrl(client_id, scope, state, response_type);

const getToken = (code, state, host) =>
  slack
    .getToken(code, state)
    .then(slackToken => {
      console.log('Got token: %s', JSON.stringify(slackToken), {});

      return getUserInfo(slackToken.access_token, slackToken.user_id).then(userInfo => {
        console.log('Got user details: %s', JSON.stringify(userInfo), {});

        // Slack returns scopes separated by commas
        // But OAuth wants them to be spaces
        // https://tools.ietf.org/html/rfc6749#section-5.1
        // Also, we need to add openid as a scope,
        // since we stripped it out earlier otherwise Slack would complain
        const scope = `openid ${slackToken.scope.replace(',', ' ')}`;

        // ** JWT ID Token required fields **
        // iss - issuer https url
        // aud - audience that this token is valid for (SLACK_CLIENT_ID)
        // sub - subject identifier - must be unique
        // ** Also required, but provided by jsonwebtoken **
        // exp - expiry time for the id token (seconds since epoch in UTC)
        // iat - time that the JWT was issued (seconds since epoch in UTC)

        return new Promise(resolve => {
          const payload = {
            // This was commented because Cognito times out in under a second
            // and generating the userInfo takes too long.
            // It means the ID token is empty except for metadata.
            ...userInfo
          };

          const idToken = crypto.makeIdToken(payload, host);
          const tokenResponse = {
            ...slackToken,
            scope,
            token_type: 'bearer',
            id_token: idToken
          };

          console.log('Resolved token response: %j', tokenResponse, {});

          resolve(tokenResponse);
        });
      });
    }).catch(error => {
      console.log(error);
    });

const getConfigFor = host => ({
  issuer: `https://${host}`,
  authorization_endpoint: `https://${host}/slack/authorize`,
  token_endpoint: `https://${host}/slack/token`,
  token_endpoint_auth_methods_supported: [
    'client_secret_basic',
    'private_key_jwt'
  ],
  token_endpoint_auth_signing_alg_values_supported: ['RS256'],
  userinfo_endpoint: `https://${host}/slack/userinfo`,
  // check_session_iframe: 'https://server.example.com/connect/check_session',
  // end_session_endpoint: 'https://server.example.com/connect/end_session',
  jwks_uri: `https://${host}/slack/.well-known/jwks.json`,
  // registration_endpoint: 'https://server.example.com/connect/register',
  scopes_supported: ['users:read', 'users:read.email'],
  response_types_supported: [
    'code',
    'code id_token',
    'id_token',
    'token id_token'
  ],

  subject_types_supported: ['public'],
  userinfo_signing_alg_values_supported: ['none'],
  id_token_signing_alg_values_supported: ['RS256'],
  request_object_signing_alg_values_supported: ['none'],
  display_values_supported: ['page', 'popup'],
  claims_supported: [
    'sub',
    'name',
    'given_name',
    'family_name',
    'team',
    'preferred_username',
    'profile',
    'picture',
    'website',
    'email',
    'email_verified',
    'updated_at',
    'iss',
    'aud'
  ]
});

module.exports = {
  getToken: getToken,
  getUserInfo: getUserInfo,
  getJwks: getJwks,
  getConfigFor: getConfigFor,
  getAuthorizeUrl: getAuthorizeUrl
};
