import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { ComplaintsRepository } from './complaints.repository';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EstimatesRepository } from '../estimates/estimates.repository';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ComplaintsRepository, EstimatesRepository],
  exports: [ComplaintsService, EstimatesRepository],
})
export class ComplaintsModule {}
