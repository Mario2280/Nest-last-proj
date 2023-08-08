import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';

export const getMongoConfig = (): MongooseModuleAsyncOptions => {
  return {
    useFactory: (configService: ConfigService) => ({
      uri: getMongoString(configService),
    }),
    inject: [ConfigService],
    imports: [ConfigModule],
  };
}

const getMongoString = (configeService: ConfigService) => {
	//console.log('mongodb://' +
  //configeService.get('MONGO_LOGIN') +
  //':' +
  //configeService.get('MONGO_PASSWORD') +
  //'@' +
  //configeService.get('MONGO_HOST') +
  //':' +
  //configeService.get('MONGO_PORT') +
  //'/' +
  //configeService.get('MONGO_AUTHDATABASE'));
	return ('mongodb://' +
  configeService.get('MONGO_LOGIN') +
  ':' +
  configeService.get('MONGO_PASSWORD') +
  '@' +
  configeService.get('MONGO_HOST') +
  ':' +
  configeService.get('MONGO_PORT') +
  '/' +
  configeService.get('MONGO_AUTHDATABASE'));
}