import { Module } from '@nestjs/common';
import { ComplaintsModule } from '../complaints/complaints.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';

@Module({
  imports: [ComplaintsModule],
  controllers: [EstimatesController],
  providers: [EstimatesService],
  exports: [EstimatesService],
})
export class EstimatesModule {}
