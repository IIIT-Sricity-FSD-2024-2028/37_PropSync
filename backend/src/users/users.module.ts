import { Module } from '@nestjs/common';
import { UsersController, AuthController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, AuthController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
