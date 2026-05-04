import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles/roles.guards';
import { UsersModule } from './users/users.module'; // Import your Users logic

@Module({
  imports: [UsersModule], // Ensure UsersModule exports UsersService
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
