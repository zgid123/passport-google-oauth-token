import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google-oauth-token') {}

@Injectable()
export class GoogleWithPhoneAuthGuard extends AuthGuard(
  'google-oauth-token-with-phone-number',
) {}
