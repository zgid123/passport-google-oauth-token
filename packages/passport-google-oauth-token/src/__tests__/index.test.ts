import { describe, it, expect, vi } from 'vitest';

import userinfo from './fixtures/userinfo.json';
import GoogleOauthTokenStrategy from '../Strategy';

import type {
  VerifyFunction,
  StrategyOptions,
  StrategyOptionsWithRequest,
} from '../interface';

const clientID = '123456';
const clientSecret = 'abcxyz';
const defaultFunction = () => {
  return;
};
const defaultAccessToken = '123abc';

const authURLVersion = 'v2';
const tokenURLVersion = 'v4';
const userinfoURLVersion = 'v3';

const initStrategy = ({
  options = {} as Omit<
    StrategyOptionsWithRequest | StrategyOptions,
    'clientID' | 'clientSecret'
  >,
  verifyFunction = undefined,
}: {
  options?: Omit<
    StrategyOptionsWithRequest | StrategyOptions,
    'clientID' | 'clientSecret'
  >;
  verifyFunction?: VerifyFunction;
} = {}) => {
  return new GoogleOauthTokenStrategy(
    {
      ...(options as StrategyOptions),
      clientID,
      clientSecret,
    },
    verifyFunction || defaultFunction,
  );
};

describe('GoogleOauthTokenStrategy#init', () => {
  it('should properly export Strategy constructor', () => {
    expect(typeof GoogleOauthTokenStrategy).toEqual('function');
  });

  it('should properly initialize', () => {
    const strategy = initStrategy();

    expect(strategy.name).toEqual('google-oauth-token');
  });

  it('should properly throw exception when options is empty', () => {
    expect(() => {
      new (GoogleOauthTokenStrategy as any)();
    }).toThrow(Error);
  });

  it('should use the default version when no explicit version is specified', () => {
    const strategy = initStrategy();

    expect(strategy.profileUrl).toEqual(
      `https://www.googleapis.com/oauth2/${userinfoURLVersion}/userinfo`,
    );
    expect(strategy.oauth2Instance.getAuthorizeUrl()).toEqual(
      `https://accounts.google.com/o/oauth2/${authURLVersion}/auth?client_id=${clientID}`,
    );
    expect(strategy.tokenURL).toEqual(
      `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`,
    );
  });

  it('should use the explicit version, if specified', () => {
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

    expect(strategy.profileUrl).toEqual(
      `https://www.googleapis.com/oauth2/${cUserinfoURLVersion}/userinfo`,
    );
    expect(strategy.oauth2Instance.getAuthorizeUrl()).toEqual(
      `https://accounts.google.com/o/oauth2/${cAuthURLVersion}/auth?client_id=${clientID}`,
    );
  });

  it('should use the explicit version for authURL, if specified', () => {
    const cAuthURLVersion = 'v1';

    const strategy = initStrategy({
      options: {
        authURLVersion: cAuthURLVersion,
      },
    });

    expect(strategy.profileUrl).toEqual(
      `https://www.googleapis.com/oauth2/${userinfoURLVersion}/userinfo`,
    );
    expect(strategy.oauth2Instance.getAuthorizeUrl()).toEqual(
      `https://accounts.google.com/o/oauth2/${cAuthURLVersion}/auth?client_id=${clientID}`,
    );
    expect(strategy.tokenURL).toEqual(
      `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`,
    );
  });

  it('should use the explicit version for userinfoURL, if specified', () => {
    const cUserinfoURLVersion = 'v1';

    const strategy = initStrategy({
      options: {
        userinfoURLVersion: cUserinfoURLVersion,
      },
    });

    expect(strategy.profileUrl).toEqual(
      `https://www.googleapis.com/oauth2/${cUserinfoURLVersion}/userinfo`,
    );
    expect(strategy.oauth2Instance.getAuthorizeUrl()).toEqual(
      `https://accounts.google.com/o/oauth2/${authURLVersion}/auth?client_id=${clientID}`,
    );
    expect(strategy.tokenURL).toEqual(
      `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`,
    );
  });
});

describe('GoogleOauthTokenStrategy#userProfile', () => {
  it('should properly fetch profile', ({ onTestFailed }) => {
    const strategy = initStrategy();

    vi.spyOn(strategy.oauth2Instance, 'get').mockImplementation(
      (_url, _accessToken, next) => {
        next(null as any, userinfo as any, null as any);
      },
    );

    strategy.userProfile(defaultAccessToken, (error, profile) => {
      if (error) {
        return onTestFailed(error);
      }

      expect(profile.provider).toEqual('google');
      expect(profile.id).toEqual('1');
      expect(profile.displayName).toEqual('Jared Hanson');
      expect(profile.name.familyName).toEqual('Hanson');
      expect(profile.name.givenName).toEqual('Jared');
      expect(profile.emails[0].value).toEqual(userinfo.email);
      expect(profile.photos[0].value).toEqual(userinfo.picture);
      expect(typeof profile._raw).toEqual('object');
      expect(typeof profile._json).toEqual('object');

      vi.clearAllMocks();
    });
  });

  it('should properly handle exception on fetching profile', () => {
    const strategy = initStrategy();

    vi.spyOn(strategy.oauth2Instance, 'get').mockImplementation(
      (_url, _accessToken, next) => {
        next(null as any, 'not a JSON');
      },
    );

    strategy.userProfile(defaultAccessToken, (error, profile) => {
      expect(error instanceof SyntaxError).toEqual(true);
      expect(profile).toBeUndefined();

      vi.clearAllMocks();
    });
  });

  it('should properly throw error on _oauth2.get error', () => {
    const strategy = initStrategy();

    vi.spyOn(strategy.oauth2Instance, 'get').mockImplementation(
      (_url, _accessToken, next) => {
        next({
          statusCode: 401,
          data: 'Some error occurred',
        });
      },
    );

    strategy.userProfile(defaultAccessToken, (error, _profile) => {
      expect(error instanceof Error).toEqual(true);

      vi.clearAllMocks();
    });
  });
});
