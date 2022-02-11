import * as express from 'express';
import * as passport from 'passport';

declare namespace PassportGoogleOauthToken {
  interface StrategyStatic {
    new(options: StrategyOptionsWithRequest, verify: VerifyFunctionWithRequest): StrategyInstance;
    new(options: StrategyOptions, verify: VerifyFunction): StrategyInstance;
  }

  interface StrategyInstance {
    name: string;
    authenticate: (req: express.Request, options?: any) => void;
  }

  interface ValueObject {
    value: string;
  }

  interface Profile extends passport.Profile {
    id: string;
    username?: string;
    name?: {
      givenName: string;
      middleName?: string;
      familyName: string;
    };
    photos: ValueObject[];
    emails: {
      value: string;
      verified: boolean;
    }[];
    displayName: string;

    _raw: string;
    _json: any;
  }

  interface StrategyOptions {
    clientID: string;
    tokenURL?: string;
    profileURL?: string;
    clientSecret: string;
    authURLVersion?: string;
    tokenURLVersion?: string;
    authorizationURL?: string;
    userinfoURLVersion?: string;
  }

  interface StrategyOptionsWithRequest extends StrategyOptions {
    passReqToCallback: true;
  }

  type VerifyFunction = (accessToken: string, refreshToken: string, profile: Profile, cb: (error: any, user?: any, info?: any) => void) => void;

  type VerifyFunctionWithRequest = (req: express.Request, accessToken: string, refreshToken: string, profile: Profile, cb: (error: any, user?: any, info?: any) => void) => void;
}

declare const PassportGoogleOauthToken: PassportGoogleOauthToken.StrategyStatic;

export = PassportGoogleOauthToken;
