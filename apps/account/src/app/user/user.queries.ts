import { Body, Controller, Get } from '@nestjs/common';
import { AccountLogin, AccountRegister, AccountUserCourses, AccountUserInfo } from '@purple/contracts';
import { RMQRoute, RMQService, RMQValidate } from 'nestjs-rmq';
import { UserRepository } from './repositories/user.repository';
import { UserEntity } from './entities/user.entity';

@Controller()
export class UserQueries {

  constructor(private readonly userRepository: UserRepository,
    private readonly rmqService: RMQService){}
  @RMQValidate()
  @RMQRoute(AccountUserInfo.topic)
  async userInfo(
    @Body() dto: AccountUserInfo.Request
  ): Promise<AccountUserInfo.Response> {
    const user = await this.userRepository.findUserById(dto.id);
    const profile = new UserEntity(user).getUserProfile();
    return {
      profile
    };
  }

  @RMQValidate()
  @RMQRoute(AccountUserCourses.topic)
  async userCourses(
    @Body() dto: AccountUserCourses.Request
  ): Promise<AccountUserCourses.Response> {
    const user = await this.userRepository.findUserById(dto.id);
    return {
      courses: user.courses
    };
  }

  @Get('healtCheck')
  async healtCheck(){
    const isRMQ = await this.rmqService.healthCheck();
    const user  = await this.userRepository.healtCheck();
}
}
