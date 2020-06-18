'use strict';

const openid = require('./openid');
var code = "";
var state = "";
module.exports.getAuthURL = (event, context, callback) => {
  var client_id = "";
  var scope = "";
  var response_type = "";
  if (event.queryStringParameters) {
    client_id = event.queryStringParameters.client_id;
    scope = event.queryStringParameters.scope.split('openid ').join('');
    response_type = event.queryStringParameters.response_type;
    state = event.queryStringParameters.state;
    console.log(event.queryStringParameters);
  }
  const r = {
    statusCode: 301,
    headers: {
      Location: openid.getAuthorizeUrl(client_id, scope, state, response_type)
    }
  };
  callback(null, r);
};

module.exports.getToken = (event, context, callback) => {
  if (event.queryStringParameters) {
    code = event.queryStringParameters.code;
    state = event.queryStringParameters.state;
  } else if (event.body) {
    const urlParams = new URLSearchParams(event.body);
    code = urlParams.get('code');
    state = urlParams.get('state');
  } 

  openid.getToken(code, state, event.headers.Host)
    .then((response) => {
      console.log(response);
      const r = {
        statusCode: 200,
        headers: {
          "Content-Type" : "application/json",
          "Cache-Control" : "no-store",
          "Pragma" : "no-cache"
        },
        body: JSON.stringify(
          response
        ),
      };
      callback(null, r);
    })
    .catch((error) => {
      console.log('ERROR');
      const r = {
        statusCode: 500,
        body: JSON.stringify(
          {
            message: 'Error:' + error,
            input: event,
          },
          null,
          2
        ),
      };
      callback(null, r);
    });
};

module.exports.getUserInfo = (event, context, callback) => {
  if (event.queryStringParameters) {
    code = event.queryStringParameters.code;
  } else if (event.body) {
    let body = JSON.parse(event.body)
    code = body.code
  } 

  openid.getUserInfo(code)
    .then((response) => {
      console.log(response);
      const r = {
        statusCode: 200,
        body: JSON.stringify(
          response
        ),
      };
      callback(null, r);
    })
    .catch((error) => {
      console.log('ERROR');
      const r = {
        statusCode: 500,
        body: JSON.stringify(
          {
            message: 'Error:' + error,
            input: event,
          },
          null,
          2
        ),
      };
      callback(null, r);
    });
};

module.exports.getJwks = (event, context, callback) => {
  const r = {
    statusCode: 200,
    body: JSON.stringify(
      openid.getJwks()
    ),
  };
  callback(null, r);
};