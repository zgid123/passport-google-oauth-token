# passport-google-oauth-token

[Passport](http://passportjs.org/) strategy for authenticating with [Google](http://www.google.com/)
access tokens using the OAuth 2.0 API.

This module is created based on [passport-facebook-token](https://github.com/drudge/passport-facebook-token)
and [passport-google-oauth2](https://github.com/jaredhanson/passport-google-oauth2).

This module lets you authenticate using Google in your Node.js applications.
By plugging into Passport, Google authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Installation

    $ npm install passport-google-oauth-token

## Usage

### Configure Strategy

The Google authentication strategy authenticates users using a Google
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `cb` providing a user, as well as
`options` specifying an app ID and app secret.

```js
const GoogleOauthTokenStrategy = require('passport-google-oauth-token');

passport.use(new GoogleOauthTokenStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
}, (accessToken, refreshToken, profile, cb) => {
  User.findOrCreate({ googleId: profile.id }, (error, user) => {
    return done(error, user);
  });
}));
```

### Authenticate Requests

Use `passport.authenticate()`, specifying the `'google-oauth-token'` strategy, to authenticate requests.

```js
app.post('/auth/google/token',
  passport.authenticate('google-oauth-token'),
  (req, res) => {
    // do something with req.user
    res.send(req.user ? 200 : 401);
  },
);
```

### Client Requests

Clients can send requests to routes that use passport-google-oauth-token authentication using `query parms`, `body`, or `HTTP headers`. Clients will need to transmit the `access_token`
and optionally the `refresh_token` that are received from google after login.

## Options

| Field              | Description                       | Default Value                                 |
| ------------------ | --------------------------------- | --------------------------------------------- |
| clientID           | Google's client id                |                                               |
| clientSecret       | Google's client secret            |                                               |
| tokenURL           | Google's oauth2 token url         | https://www.googleapis.com/oauth2/v4/token    |
| profileURL         | Google's scope profile url        | https://www.googleapis.com/oauth2/v3/userinfo |
| authorizationURL   | Google's oauth2 authorization url | https://accounts.google.com/o/oauth2/v2/auth  |
| tokenURLVersion    | Version of token url              | v4                                            |
| userinfoURLVersion | Version of profile url            | v3                                            |
| authURLVersion     | Version of authorization url      | v2                                            |

## Profile Example

```js
{
  provider: 'google',
  id: '1234',
  displayName: 'Alpha',
  name: {
    familyName: 'Lucifer',
    givenName: 'Alpha',
  },
  emails: [
    {
      value: 'alphanolucifer@gmail.com',
      verified: true,
    },
  ],
  photos: [
    {
      value: 'https://google.com',
    },
  ],
  _json: {},
  _raw: {},
}
```

## License

The MIT License (MIT)

Copyright (c) 2015 Nicholas Penree

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
