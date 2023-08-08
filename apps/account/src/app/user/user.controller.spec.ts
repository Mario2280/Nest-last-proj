import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { getMongoConfig } from '../configs/mongo.config';
import { RMQModule, RMQService, RMQTestService } from 'nestjs-rmq';
import { INestApplication } from '@nestjs/common';
import { UserRepository } from '../user/repositories/user.repository';
import {
  AccountBuyCourse,
  AccountCheckPayment,
  AccountLogin,
  AccountRegister,
  AccountUserInfo,
  CourseGetCourse,
  PaymentCheck,
  PaymentGenerateLink,
} from '@purple/contracts';
import { disconnect } from 'mongoose';
import { verify } from 'jsonwebtoken';

const authLogin: AccountLogin.Request = {
  email: 'a@a2.ru',
  password: '1',
};

const authRegister: AccountRegister.Request = {
  ...authLogin,
  displayName: 'David2',
};

const courseId = 'courseId';

describe('UserController', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let rmqService: RMQTestService;
  let token: string;
  let userId: string;
  let configService: ConfigService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'envs/.account.env',
        }),
        RMQModule.forTest({}),
        UserModule,
        AuthModule,
        MongooseModule.forRootAsync(getMongoConfig()),
      ],
    }).compile();
    app = module.createNestApplication();
    userRepository = app.get<UserRepository>(UserRepository);
    configService = app.get<ConfigService>(ConfigService);
    rmqService = app.get(RMQService);

    await app.init();

    await rmqService.triggerRoute<
      AccountRegister.Request,
      AccountRegister.Response
    >(AccountRegister.topic, authRegister);

    const { access_token } = await rmqService.triggerRoute<
      AccountLogin.Request,
      AccountLogin.Response
    >(AccountLogin.topic, authLogin);

    token = access_token;

    const data = verify(token, configService.get('JWT_SECRET'));
    userId = data['id'];
  });

  it('AccountUserInfo', async () => {
    const res = await rmqService.triggerRoute<
      AccountUserInfo.Request,
      AccountUserInfo.Response
    >(AccountUserInfo.topic, { id: userId });

    expect(res.profile.displayName).toEqual(authRegister.displayName);
  });

  

   it('BuyCourse', async () => {
     const paymentLink = 'paymentLink';

     rmqService.mockReply<CourseGetCourse.Response>(CourseGetCourse.topic, {
       course: {
         _id: courseId,
         price: 1000,
       },
     });
     rmqService.mockReply<PaymentGenerateLink.Response>(
       PaymentGenerateLink.topic,
       {
         paymentLink,
       }
     );

     const res = await rmqService.triggerRoute<
       AccountBuyCourse.Request,
       AccountBuyCourse.Response
     >(AccountBuyCourse.topic, {
       courseId,
       userId,
     });
     expect(res.paymentLink).toEqual(paymentLink);

     //await expect(
     //  rmqService.triggerRoute<
     //    AccountBuyCourse.Request,
     //    AccountBuyCourse.Response
     //  >(AccountBuyCourse.topic, {
     //    courseId,
     //    userId,
     //  })
     //).rejects.toThrowError();
   });

   it('CheckPayment', async () => {
     rmqService.mockReply<PaymentCheck.Response>(PaymentCheck.topic, {
       status: 'success',
     });

     const res = await rmqService.triggerRoute<
       AccountCheckPayment.Request,
       AccountCheckPayment.Response
     >(AccountCheckPayment.topic, {
       courseId,
       userId,
     });
     expect(res.status).toEqual('success');

     //await expect(
     //  rmqService.triggerRoute<
     //    AccountBuyCourse.Request,
     //    AccountBuyCourse.Response
     //  >(AccountBuyCourse.topic, {
     //    courseId,
     //    userId,
     //  })
     //).rejects.toThrowError();
   });

  afterAll(async () => {
    await userRepository.deleteUser(authRegister.email);
    disconnect();
    app.close();
  });
});
