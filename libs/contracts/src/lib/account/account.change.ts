import {   IsString,  } from 'class-validator';
import { IUser } from '@purple/interfaces';
export namespace AccountChange {
  export const topic = 'account.change-profile.command';

  export class Request  {
    @IsString()
    user: Pick<IUser, 'displayName'>;
    @IsString()
    id: string;
  }

  export class Response {

  }
}
