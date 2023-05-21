/* eslint-disable @typescript-eslint/naming-convention */
import OAuth2Strategy from 'passport-oauth2';

import {
  InternalOAuthError,
  type VerifyFunctionWithRequest as POVerifyFunctionWithRequest,
} from 'passport-oauth2';

import type { OAuth2 } from 'oauth';
import type { Request } from 'express';

import type {
  Profile,
  VerifyCallback,
  VerifyFunction,
  SkipUserProfile,
  StrategyOptions,
  VerifyFunctionWithRequest,
  StrategyOptionsWithRequest,
} from './interface';

interface IProfileJSON {
  id: string;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified: boolean;
}

export default class GoogleOauthTokenStrategy extends OAuth2Strategy {
  protected _tokenURL: string;
  protected _profileURL: string;
  protected _profileParser: (data: any) => any;
  protected _passReqToCallback: boolean | undefined;
  protected _skipUserProfile: boolean | SkipUserProfile;
  protected _verify: VerifyFunctionWithRequest | VerifyFunction;

  constructor(
    options: StrategyOptionsWithRequest,
    verify: VerifyFunctionWithRequest,
  );
  constructor(options: StrategyOptions, verify: VerifyFunction);
  constructor(
    {
      tokenURL,
      profileURL,
      profileParser,
      authURLVersion,
      tokenURLVersion,
      skipUserProfile,
      authorizationURL,
      passReqToCallback,
      userinfoURLVersion,
      ...rest
    }: StrategyOptionsWithRequest | StrategyOptions = {} as
      | StrategyOptionsWithRequest
      | StrategyOptions,
    verify: VerifyFunctionWithRequest | VerifyFunction,
  ) {
    super(
      {
        ...rest,
        skipUserProfile,
        passReqToCallback,
        tokenURL:
          tokenURL ||
          `https://www.googleapis.com/oauth2/${tokenURLVersion || 'v4'}/token`,
        authorizationURL:
          authorizationURL ||
          `https://accounts.google.com/o/oauth2/${authURLVersion || 'v2'}/auth`,
      } as Required<StrategyOptionsWithRequest>,
      verify as unknown as POVerifyFunctionWithRequest,
    );

    this.name = 'google-oauth-token';

    this._skipUserProfile =
      skipUserProfile === undefined ? false : skipUserProfile;

    this._passReqToCallback = passReqToCallback;

    this._verify = verify;

    this._profileURL =
      profileURL ||
      `https://www.googleapis.com/oauth2/${
        userinfoURLVersion || 'v3'
      }/userinfo`;

    this._tokenURL =
      tokenURL ||
      `https://www.googleapis.com/oauth2/${tokenURLVersion || 'v4'}/token`;

    this._profileParser =
      profileParser || GoogleOauthTokenStrategy.parseProfile;
  }

  public authenticate(
    req: Request,
    _options: StrategyOptionsWithRequest,
  ): void {
    const accessToken = this._lookup(req, 'access_token');
    const refreshToken = this._lookup(req, 'refresh_token');

    this._loadUserProfile(
      accessToken,
      (error: Error | null | undefined, profile: Profile | undefined) => {
        if (error) {
          return this.error(error);
        }

        const verified = (
          error: Error,
          user: Profile | undefined,
          // eslint-disable-next-line @typescript-eslint/ban-types
          info: object,
        ) => {
          if (error) {
            return this.error(error);
          }

          if (!user) {
            return this.fail(info);
          }

          return this.success(user, info);
        };

        // TODO: fix type based on passReqToCallback param
        if (this._passReqToCallback) {
          (this._verify as VerifyFunctionWithRequest)(
            req,
            accessToken,
            refreshToken,
            profile,
            verified,
          );
        } else {
          (this._verify as VerifyFunction)(
            accessToken,
            refreshToken,
            profile,
            verified,
          );
        }
      },
    );
  }

  public userProfile(accessToken: string, done: VerifyCallback): void {
    this._oauth2.get(this._profileURL, accessToken, (error, body, _res) => {
      if (error) {
        return done(
          new InternalOAuthError('Failed to fetch user profile', error),
        );
      }

      try {
        let json = body;

        if (typeof body === 'string') {
          json = JSON.parse(body);
        }

        const profile = this._profileParser(json);
        profile._raw = body as string;

        done(null, profile);
      } catch (e) {
        done(e as Error);
      }
    });
  }

  protected _lookupAuthorization(req: Request): string {
    if (!req.headers?.authorization) {
      return '';
    }

    const matches = req.headers.authorization.match(/(\S+)\s+(\S+)/);

    if (matches?.[1].toLowerCase() !== 'bearer') {
      return '';
    }

    return matches?.[2] || '';
  }

  protected _lookup(req: Request, field: string): string {
    return (
      (req.body && req.body[field]) ||
      (req.query && req.query[field]) ||
      (req.headers && req.headers[field]) ||
      this._lookupAuthorization(req)
    );
  }

  protected _loadUserProfile(accessToken: string, done: VerifyCallback): void {
    const loadIt = () => {
      return this.userProfile(accessToken, done);
    };

    const skipIt = () => {
      return done(null);
    };

    if (
      typeof this._skipUserProfile == 'function' &&
      this._skipUserProfile.length > 1
    ) {
      this._skipUserProfile(accessToken, function (err, skip) {
        if (err) {
          return done(err);
        }

        if (!skip) {
          return loadIt();
        }

        return skipIt();
      });
    } else {
      const skip =
        typeof this._skipUserProfile == 'function'
          ? this._skipUserProfile()
          : this._skipUserProfile;

      if (!skip) {
        return loadIt();
      }

      return skipIt();
    }
  }

  public get profileUrl(): string {
    return this._profileURL;
  }

  public get oauth2Instance(): OAuth2 {
    return this._oauth2;
  }

  public get tokenURL(): string {
    return this._tokenURL;
  }

  static parseProfile(json: IProfileJSON): Profile {
    const profile = {
      provider: 'google',
      id: json.sub || json.id,
      displayName: json.name || '',
    } as Profile;

    if (json.family_name || json.given_name) {
      profile.name = {
        familyName: json.family_name,
        givenName: json.given_name,
      };
    }

    if (json.email) {
      profile.emails = [{ value: json.email, verified: json.email_verified }];
    }

    if (json.picture) {
      profile.photos = [{ value: json.picture }];
    }

    profile._json = json;

    return profile;
  }
}
