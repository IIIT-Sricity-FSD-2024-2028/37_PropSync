import { Module } from '@nestjs/common';
import { ComplaintsModule } from '../complaints/complaints.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimatesRepository } from './estimates.repository';

@Module({
  imports: [ComplaintsModule],
  controllers: [EstimatesController],
  providers: [EstimatesService, EstimatesRepository],
  exports: [EstimatesService],
})
export class EstimatesModule {}
