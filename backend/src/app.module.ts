import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './common/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { BillsModule } from './modules/bills/bills.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    UsersModule,
    ComplaintsModule,
    EstimatesModule,
    BillsModule,
    PaymentsModule,
    MaintenanceModule,
    NotificationsModule,
    RatingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
