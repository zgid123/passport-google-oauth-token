const OAuth2Strategy = require('passport-oauth2');

const InternalOAuthError = OAuth2Strategy.InternalOAuthError;

/**
 * `GoogleOauthTokenStrategy` constructor.
 *
 * The Google authentication strategy authenticates requests by delegating to
 * Google using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * @param {Object} options
 * @param {Function} verify
 * @example
 * passport.use(new GoogleOauthTokenStrategy(
 *   {
 *     clientID: '123456789',
 *     clientSecret: 'abcxyz',
 *   },
 *   (accessToken, refreshToken, profile, cb) => {
 *     User.findOrCreate({ googleId: profile.id }, cb);
 *   }
 * );
 */
export default class GoogleOauthTokenStrategy extends OAuth2Strategy {
  constructor(options = {}, verify) {
    const authURLVersion = options.authURLVersion || 'v2';
    const tokenURLVersion = options.tokenURLVersion || 'v4';
    const userinfoURLVersion = options.userinfoURLVersion || 'v3';

    options.tokenURL = options.tokenURL || `https://www.googleapis.com/oauth2/${tokenURLVersion}/token`;
    options.authorizationURL = options.authorizationURL || `https://accounts.google.com/o/oauth2/${authURLVersion}/auth`;
    super(options, verify);

    this.name = 'google-oauth-token';
    this._profileURL = options.profileURL || `https://www.googleapis.com/oauth2/${userinfoURLVersion}/userinfo`;
  }

  /**
   * Authenticate request by delegating to a service provider using OAuth 2.0.
   * @param {Object} req
   * @param {Object} options
   */
  authenticate(req, _options) {
    const accessToken = this.lookup(req, 'access_token');
    const refreshToken = this.lookup(req, 'refresh_token');

    this._loadUserProfile(accessToken, (error, profile) => {
      if (error) {
        return this.error(error);
      }

      const verified = (error, user, info) => {
        if (error) {
          return this.error(error);
        }

        if (!user) {
          return this.fail(info);
        }

        return this.success(user, info);
      };

      if (this._passReqToCallback) {
        this._verify(req, accessToken, refreshToken, profile, verified);
      } else {
        this._verify(accessToken, refreshToken, profile, verified);
      }
    });
  }

  /**
   * Retrieve user profile from Google.
   *
   * This function constructs a normalized profile, with the following properties:
   *
   *   - `provider`         always set to `google`
   *   - `id`               the user's Google ID
   *   - `username`         the user's Google username
   *   - `displayName`      the user's full name
   *
   * @param {String} accessToken
   * @param {Function} done
   */
  userProfile(accessToken, done) {
    this._oauth2.get(this._profileURL, accessToken, (error, body, _res) => {
      if (error) {
        return done(new InternalOAuthError('Failed to fetch user profile', error));
      }

      try {
        let json = body;

        if (typeof body === 'string') {
          json = JSON.parse(body);
        }

        const profile = GoogleOauthTokenStrategy.parseProfile(json);
        profile._raw = body;

        done(null, profile);
      } catch (e) {
        done(e);
      }
    });
  }

  /**
   * This method handles searhing the value of provided field in body, query, and header.
   *
   * @param {Object} req http request object
   * @param {String} field
   * @returns {String} field's value in body, query, or headers
   */
  lookup(req, field) {
    return (
      (req.body && req.body[field]) ||
      (req.query && req.query[field]) ||
      (req.headers && req.headers[field])
    );
  }

  /**
   * Parse profile.
   *
   * Parses user profiles as fetched from Google's OpenID Connect-compatible user
   * info endpoint.
   *
   * The amount of detail in the profile varies based on the scopes granted by the
   * user. The following scope values add additional data:
   *
   *     `profile` - basic profile information
   *     `email` - email address
   *
   * References:
   *   - https://developers.google.com/identity/protocols/OpenIDConnect
   *
   * @param {object} json
   * @return {object}
   */
  static parseProfile(json) {
    const profile = {
      provider: 'google',
      id: json.sub || json.id,
      displayName: json.name || '',
    };

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
