import type { Profile } from 'passport-google-oauth-token';

export interface IProfileProps extends Profile {
  phoneNumbers?: string[];
}

interface IMetadataProps {
  source: {
    id: string;
    type: string;
  };
  primary: boolean;
  verified?: boolean;
  sourcePrimary?: boolean;
}

interface IPhotoProps {
  url: string;
  default: boolean;
  metadata: IMetadataProps;
}

interface INameProps {
  givenName: string;
  familyName: string;
  displayName: string;
  unstructuredName: string;
  metadata: IMetadataProps;
  displayNameLastFirst: string;
}

interface IPhoneNumberProps {
  type: string;
  value: string;
  canonicalForm: string;
  formattedType: string;
  metadata: IMetadataProps;
}

interface ILocaleProps {
  value: string;
  metadata: IMetadataProps;
}

interface IEmailProps {
  value: string;
  metadata: IMetadataProps;
}

export interface IGoogleUserProps {
  etag: string;
  names: INameProps[];
  resourceName: string;
  photos: IPhotoProps[];
  locales: ILocaleProps[];
  coverPhotos: IPhotoProps[];
  emailAddresses: IEmailProps[];
  phoneNumbers: IPhoneNumberProps[];
  metadata: {
    objectType: string;
    sources: {
      id: string;
      etag: string;
      type: string;
      updateTime: string;
      profileMetadata: {
        objectType: string;
        userTypes: string[];
      };
    }[];
  };
}
