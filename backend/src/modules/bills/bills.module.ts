import { Module } from '@nestjs/common';
import { ComplaintsModule } from '../complaints/complaints.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { BillsRepository } from './bills.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ComplaintsModule, NotificationsModule],
  controllers: [BillsController],
  providers: [BillsService, BillsRepository],
  exports: [BillsService],
})
export class BillsModule {}
