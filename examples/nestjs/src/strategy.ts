import { Injectable } from '@nestjs/common';
import Strategy from 'passport-google-oauth-token';
import { PassportStrategy } from '@nestjs/passport';

import type { Profile, VerifyCallback } from 'passport-google-oauth-token';

import type { IGoogleUserProps, IProfileProps } from 'interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  'google-oauth-token',
) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    done(null, profile);
  }
}

@Injectable()
export class GoogleWithPhoneNumberStrategy extends PassportStrategy(
  Strategy,
  'google-oauth-token-with-phone-number',
) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      profileURL: 'https://people.googleapis.com/v1/people/me',
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.phonenumbers.read',
      ],
      profileParser: (user: IGoogleUserProps): IProfileProps => {
        const { names, photos, phoneNumbers, emailAddresses, ...rest } = user;
        const [name] = names || [];
        const [phoneNumber] = phoneNumbers || [];
        const [email] = emailAddresses || [];
        const { metadata, displayName, familyName, givenName } = name || {};

        console.log(emailAddresses);
        console.log(rest);

        return {
          provider: 'google',
          id: metadata.source.id,
          displayName,
          name:
            familyName || givenName
              ? {
                  givenName,
                  familyName,
                }
              : {},
          emails: [
            {
              value: email.value,
              verified: email.metadata.verified,
            },
          ],
          phoneNumbers: [phoneNumber.value],
          photos: [{ value: photos[0]?.url || '' }],
          _raw: JSON.stringify(user),
          _json: user,
        };
      },
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    done(null, profile);
  }
}
