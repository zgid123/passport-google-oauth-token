/* global describe, it, before, after */
import chai, { assert } from 'chai';
import { stub } from 'sinon';

import userinfo from './fixtures/userinfo';
import GoogleOauthTokenStrategy from '../src';

chai.use(require('chai-passport-strategy'));

const clientID = '123456';
const clientSecret = 'abcxyz';
const defaultFunction = () => { };
const defaultAccessToken = '123abc';
const defaultRefreshToken = '456xyz';
const defaultBody = {
  access_token: defaultAccessToken,
  refresh_token: defaultRefreshToken,
};

let authURLVersion = 'v2';
let tokenURLVersion = 'v4';
let userinfoURLVersion = 'v3';

const initStrategy = ({ options = {}, verifyFunction = undefined } = {}) => {
  return new GoogleOauthTokenStrategy({
    clientID,
    clientSecret,
    ...options,
  }, verifyFunction || defaultFunction);
};

describe('GoogleOauthTokenStrategy#init', () => {
  it('Should properly export Strategy constructor', () => {
    assert.isFunction(GoogleOauthTokenStrategy);
  });

  it('Should properly initialize', () => {
    const strategy = initStrategy();

    assert.equal(strategy.name, 'google-oauth-token');
  });

  it('Should properly throw exception when options is empty', () => {
    assert.throw(() => new GoogleOauthTokenStrategy(), Error);
  });

  it('Should use the default version when no explicit version is specified', () => {
    const strategy = initStrategy();

    assert.equal(strategy._profileURL, `https://www.googleapis.com/oauth2/${userinfoURLVersion}/userinfo`);
    assert.equal(strategy._oauth2._authorizeUrl, `https://accounts.google.com/o/oauth2/${authURLVersion}/auth`);
    assert.equal(strategy._oauth2._accessTokenUrl, `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`);
  });

  it('Should use the explicit version, if specified', () => {
    const cAuthURLVersion = 'v1';
    const cTokenURLVersion = 'v1';
    const cUserinfoURLVersion = 'v1';

    const strategy = initStrategy({
      options: {
        authURLVersion: cAuthURLVersion,
        tokenURLVersion: cTokenURLVersion,
        userinfoURLVersion: cUserinfoURLVersion,
      },
    });

    assert.equal(strategy._profileURL, `https://www.googleapis.com/oauth2/${cUserinfoURLVersion}/userinfo`);
    assert.equal(strategy._oauth2._authorizeUrl, `https://accounts.google.com/o/oauth2/${cAuthURLVersion}/auth`);
    assert.equal(strategy._oauth2._accessTokenUrl, `https://www.googleapis.com/oauth2/${cTokenURLVersion}/token`);
  });

  it('Should use the explicit version for authURL, if specified', () => {
    const cAuthURLVersion = 'v1';

    const strategy = initStrategy({
      options: {
        authURLVersion: cAuthURLVersion,
      },
    });

    assert.equal(strategy._profileURL, `https://www.googleapis.com/oauth2/${userinfoURLVersion}/userinfo`);
    assert.equal(strategy._oauth2._authorizeUrl, `https://accounts.google.com/o/oauth2/${cAuthURLVersion}/auth`);
    assert.equal(strategy._oauth2._accessTokenUrl, `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`);
  });

  it('Should use the explicit version for tokenURL, if specified', () => {
    const cTokenURLVersion = 'v1';

    const strategy = initStrategy({
      options: {
        tokenURLVersion: cTokenURLVersion,
      },
    });

    assert.equal(strategy._profileURL, `https://www.googleapis.com/oauth2/${userinfoURLVersion}/userinfo`);
    assert.equal(strategy._oauth2._authorizeUrl, `https://accounts.google.com/o/oauth2/${authURLVersion}/auth`);
    assert.equal(strategy._oauth2._accessTokenUrl, `https://www.googleapis.com/oauth2/${cTokenURLVersion}/token`);
  });

  it('Should use the explicit version for userinfoURL, if specified', () => {
    const cUserinfoURLVersion = 'v1';

    const strategy = initStrategy({
      options: {
        userinfoURLVersion: cUserinfoURLVersion,
      },
    });

    assert.equal(strategy._profileURL, `https://www.googleapis.com/oauth2/${cUserinfoURLVersion}/userinfo`);
    assert.equal(strategy._oauth2._authorizeUrl, `https://accounts.google.com/o/oauth2/${authURLVersion}/auth`);
    assert.equal(strategy._oauth2._accessTokenUrl, `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`);
  });
});

describe('GoogleOauthTokenStrategy#authenticate', () => {
  describe('Authenticate without passReqToCallback', () => {
    let strategy;

    before(() => {
      strategy = initStrategy({
        verifyFunction: (accessToken, refreshToken, profile, next) => {
          assert.typeOf(next, 'function');
          assert.typeOf(profile, 'object');
          assert.equal(accessToken, defaultAccessToken);
          assert.equal(refreshToken, defaultRefreshToken);

          return next(null, profile, { info: 'foo' });
        },
      });

      stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, userinfo, null));
    });

    after(() => strategy._oauth2.get.restore());

    it('Should properly parse access_token from body', (done) => {
      chai
        .passport
        .use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, { info: 'foo' });

          done();
        })
        .req((req) => {
          req.body = defaultBody;
        })
        .authenticate({});
    });

    it('Should properly parse access_token from query', (done) => {
      chai
        .passport
        .use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, { info: 'foo' });

          done();
        })
        .req((req) => {
          req.query = defaultBody;
        })
        .authenticate({});
    });

    it('Should properly parse access token from access_token header', (done) => {
      chai
        .passport
        .use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, { info: 'foo' });

          done();
        })
        .req((req) => {
          req.headers = defaultBody;
        })
        .authenticate({});
    });

    it('Should properly call fail if access_token is not provided', (done) => {
      strategy = initStrategy({
        verifyFunction: (accessToken, refreshToken, profile, next) => {
          assert.typeOf(next, 'function');
          assert.typeOf(profile, 'object');
          assert.equal(accessToken, undefined);
          assert.equal(refreshToken, undefined);

          return next(new Error('Failed to fetch user profile'));
        },
      });

      stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, userinfo, null));

      chai.passport.use(strategy).error((error) => {
        assert.instanceOf(error, Error);

        done();
      }).authenticate({});
    });
  });

  describe('Authenticate with passReqToCallback', () => {
    let strategy;

    before(() => {
      strategy = initStrategy({
        options: {
          passReqToCallback: true,
        },
        verifyFunction: (req, accessToken, refreshToken, profile, next) => {
          assert.typeOf(req, 'object');
          assert.typeOf(next, 'function');
          assert.typeOf(profile, 'object');
          assert.equal(accessToken, defaultAccessToken);
          assert.equal(refreshToken, defaultRefreshToken);

          return next(null, profile, { info: 'foo' });
        },
      });

      stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, userinfo, null));
    });

    after(() => strategy._oauth2.get.restore());

    it('Should properly call _verify with req', (done) => {
      chai
        .passport
        .use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, { info: 'foo' });

          done();
        })
        .req((req) => {
          req.body = defaultBody;
        })
        .authenticate({});
    });
  });

  describe('Failed authentications', () => {
    it('Should properly return error on loadUserProfile', (done) => {
      const strategy = initStrategy({
        verifyFunction: (accessToken, refreshToken, profile, next) => {
          assert.typeOf(next, 'function');
          assert.typeOf(profile, 'object');
          assert.equal(accessToken, defaultAccessToken);
          assert.equal(refreshToken, defaultRefreshToken);

          return next(null, profile, { info: 'foo' });
        },
      });

      stub(strategy, '_loadUserProfile').callsFake((_accessToken, next) => next(new Error('Some error occurred')));

      chai
        .passport
        .use(strategy)
        .error((error) => {
          assert.instanceOf(error, Error);
          strategy._loadUserProfile.restore();

          done();
        })
        .req((req) => {
          req.body = defaultBody;
        })
        .authenticate({});
    });

    it('Should properly return error on verified', (done) => {
      const strategy = initStrategy({
        verifyFunction: (accessToken, refreshToken, profile, next) => {
          assert.typeOf(next, 'function');
          assert.typeOf(profile, 'object');
          assert.equal(accessToken, defaultAccessToken);
          assert.equal(refreshToken, defaultRefreshToken);

          return next(new Error('Some error occurred'));
        },
      });

      stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, userinfo, null));

      chai
        .passport
        .use(strategy)
        .error((error) => {
          assert.instanceOf(error, Error);
          strategy._oauth2.get.restore();

          done();
        })
        .req((req) => {
          req.body = defaultBody;
        })
        .authenticate({});
    });

    it('Should properly return error on verified', (done) => {
      const strategy = initStrategy({
        verifyFunction: (accessToken, refreshToken, profile, next) => {
          assert.typeOf(next, 'function');
          assert.typeOf(profile, 'object');
          assert.equal(accessToken, defaultAccessToken);
          assert.equal(refreshToken, defaultRefreshToken);

          return next(null, null, 'INFO');
        },
      });

      stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, userinfo, null));

      chai
        .passport
        .use(strategy)
        .fail((error) => {
          assert.equal(error, 'INFO');
          strategy._oauth2.get.restore();

          done();
        })
        .req((req) => {
          req.body = defaultBody;
        })
        .authenticate({});
    });
  });
});

describe('GoogleOauthTokenStrategy#userProfile', () => {
  it('Should properly fetch profile', (done) => {
    const strategy = initStrategy();

    stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, userinfo, null));

    strategy.userProfile(defaultAccessToken, (error, profile) => {
      if (error) {
        return done(error);
      }

      assert.equal(profile.provider, 'google');
      assert.equal(profile.id, '1');
      assert.equal(profile.displayName, 'Jared Hanson');
      assert.equal(profile.name.familyName, 'Hanson');
      assert.equal(profile.name.givenName, 'Jared');
      assert.equal(profile.emails[0].value, userinfo.email);
      assert.equal(profile.photos[0].value, userinfo.picture);
      assert.equal(typeof profile._raw, 'object');
      assert.equal(typeof profile._json, 'object');

      strategy._oauth2.get.restore();

      done();
    });
  });

  it('Should properly handle exception on fetching profile', (done) => {
    const strategy = initStrategy();

    stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next(null, 'not a JSON'));

    strategy.userProfile(defaultAccessToken, (error, profile) => {
      assert(error instanceof SyntaxError);
      assert.equal(typeof profile, 'undefined');

      strategy._oauth2.get.restore();

      done();
    });
  });

  it('Should properly throw error on _oauth2.get error', (done) => {
    const strategy = initStrategy();

    stub(strategy._oauth2, 'get').callsFake((_url, _accessToken, next) => next('Some error occurred'));

    strategy.userProfile(defaultAccessToken, (error, _profile) => {
      assert.instanceOf(error, Error);

      strategy._oauth2.get.restore();

      done();
    });
  });
});
