const JSONWebKey = require('json-web-key');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { SLACK_CLIENT_ID } = require('./config');

const KEY_ID = 'jwtRS256';
const cert = fs.readFileSync('./keys/jwtRS256.key', {encoding: 'utf8'});
const pubKey = fs.readFileSync('./keys/jwtRS256.key.pub', {encoding: 'utf8'});

module.exports = {
  getPublicKey: () => ({
    alg: 'RS256',
    kid: KEY_ID,
    ...JSONWebKey.fromPEM(pubKey).toJSON()
  }),

  makeIdToken: (payload, host) => {
    const enrichedPayload = {
      ...payload,
      iss: `https://${host}`,
      aud: SLACK_CLIENT_ID
    };
    console.log('Signing payload %j', enrichedPayload, {});
    return jwt.sign(enrichedPayload, cert, {
      expiresIn: '1h',
      algorithm: 'RS256',
      keyid: KEY_ID
    });
  }
};
