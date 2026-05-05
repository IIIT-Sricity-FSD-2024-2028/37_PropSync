import { Module } from '@nestjs/common';
import { ComplaintsModule } from '../complaints/complaints.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { BillsRepository } from './bills.repository';

@Module({
  imports: [ComplaintsModule],
  controllers: [BillsController],
  providers: [BillsService, BillsRepository],
  exports: [BillsService],
})
export class BillsModule {}
