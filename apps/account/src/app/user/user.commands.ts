import { Body, Controller } from '@nestjs/common';
import {
  AccountBuyCourse,
  AccountChange,
  AccountCheckPayment,
  AccountLogin,
  AccountRegister,
} from '@purple/contracts';
import { RMQRoute, RMQService, RMQValidate } from 'nestjs-rmq';
import { UserRepository } from './repositories/user.repository';
import { UserEntity } from './entities/user.entity';
import { BuyCourseSaga } from './sagas/buy-course.saga';
import { UserService } from './user.service';

@Controller()
export class UserCommands {
  constructor(private readonly userService: UserService) {}

  async updateUser(
    @Body() { user, id }: AccountChange.Request
  ): Promise<AccountChange.Response> {
    return this.userService.changeProfile(user, id);
  }

  @RMQValidate()
  @RMQRoute(AccountCheckPayment.topic)
  async checkPaymentCourse(
    @Body() { userId, courseId }: AccountCheckPayment.Request
  ): Promise<AccountCheckPayment.Response> {
    return this.userService.checkPaymentCourse(userId, courseId);
  }

  @RMQValidate()
  @RMQRoute(AccountBuyCourse.topic)
  async buyCourse(
    @Body() { userId, courseId }: AccountBuyCourse.Request
  ): Promise<AccountBuyCourse.Response> {
    return this.userService.buyCourse(userId, courseId);
  }
}
