import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { UsersModule } from './modules/users/users.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { BillsModule } from './modules/bills/bills.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { UsersController } from './modules/users/users.controller';
import { ComplaintsController } from './modules/complaints/complaints.controller';
import { EstimatesController } from './modules/estimates/estimates.controller';
import { BillsController } from './modules/bills/bills.controller';
import { PaymentsController } from './modules/payments/payments.controller';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { RatingsController } from './modules/ratings/ratings.controller';
import { MaintenanceController } from './modules/maintenance/maintenance.controller';

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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      // Register on API routers only. Static uploads and Swagger are not API
      // controller routes and therefore do not receive request logging.
      .forRoutes(
        UsersController,
        ComplaintsController,
        EstimatesController,
        BillsController,
        PaymentsController,
        MaintenanceController,
        NotificationsController,
        RatingsController,
      );
  }
}
