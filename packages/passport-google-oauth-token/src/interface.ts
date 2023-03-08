import type { Request } from 'express';
import type {
  StrategyOptions as POStrategyOptions,
  StrategyOptionsWithRequest as POStrategyOptionsWithRequest,
} from 'passport-oauth2';

type TOmitDefault<T extends POStrategyOptions | POStrategyOptionsWithRequest> =
  Omit<T, 'skipUserProfile' | 'tokenURL' | 'authorizationURL'>;

type TSkipUserProfileCallback = (
  err: Error | null | undefined,
  skip: boolean,
) => void;

export type SkipUserProfile = (
  accessToken?: string,
  skipCallback?: TSkipUserProfileCallback,
) => void;

interface IStrategyBaseOptions {
  tokenURL?: string;
  profileURL?: string;
  authURLVersion?: string;
  tokenURLVersion?: string;
  authorizationURL?: string;
  userinfoURLVersion?: string;
  skipUserProfile?: SkipUserProfile;
  profileParser?: (data: any) => any;
}

interface IValueObject {
  value: string;
}

export interface StrategyOptions
  extends IStrategyBaseOptions,
    TOmitDefault<POStrategyOptions> {}

export interface StrategyOptionsWithRequest
  extends IStrategyBaseOptions,
    TOmitDefault<POStrategyOptionsWithRequest> {}

export interface Profile {
  id: string;
  provider: 'google';
  username?: string;
  name?: {
    givenName?: string;
    middleName?: string;
    familyName?: string;
  };
  photos: IValueObject[];
  emails: {
    value: string;
    verified: boolean;
  }[];
  displayName: string;
  _raw: string;
  _json: any;
}

export type VerifyCallback = (error: any, user?: any, info?: any) => void;

export type VerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: Profile | undefined,
  cb: VerifyCallback,
) => void;

export type VerifyFunctionWithRequest = (
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile | undefined,
  cb: VerifyCallback,
) => void;
