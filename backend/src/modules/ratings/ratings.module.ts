import { Module } from '@nestjs/common';
import { ComplaintsModule } from '../complaints/complaints.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { RatingsRepository } from './ratings.repository';

@Module({
  imports: [ComplaintsModule],
  controllers: [RatingsController],
  providers: [RatingsService, RatingsRepository],
  exports: [RatingsService],
})
export class RatingsModule {}
