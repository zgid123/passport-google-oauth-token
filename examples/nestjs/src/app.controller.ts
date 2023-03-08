/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, Post, Request, UseGuards } from '@nestjs/common';

import { GoogleAuthGuard, GoogleWithPhoneAuthGuard } from 'guard';

@Controller()
export class AppController {
  @UseGuards(GoogleAuthGuard)
  @Post('google')
  async signInUsingGoogle(@Request() req: any): Promise<any> {
    return req.user;
  }

  @UseGuards(GoogleWithPhoneAuthGuard)
  @Post('google-with-phone')
  async signInWithPhoneUsingGoogle(@Request() req: any): Promise<any> {
    return req.user;
  }
}
