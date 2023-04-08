import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AppController } from 'app.controller';
import { GoogleStrategy, GoogleWithPhoneNumberStrategy } from 'strategy';

@Module({
  imports: [PassportModule],
  controllers: [AppController],
  providers: [GoogleStrategy, GoogleWithPhoneNumberStrategy],
})
export class AppModule {}
