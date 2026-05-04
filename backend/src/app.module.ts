import { Module } from '@nestjs/common';
import { ComplaintsModule } from './complaints/complaints.module';
import { EstimatesModule } from './estimates/estimates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { BillsModule } from './bills/bills.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { AuthModule } from './auth.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
  imports: [
    AuthModule,
    ComplaintsModule,
    EstimatesModule,
    NotificationsModule,
    PaymentsModule,
    BillsModule,
    UsersModule,
    ProvidersModule,
    RatingsModule,
  ],
})
export class AppModule {}
