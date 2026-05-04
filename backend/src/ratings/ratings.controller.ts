import { Controller, Get, Headers } from '@nestjs/common';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) { }

  @Get()
  findAll(
    @Headers('role') role: string,
    @Headers('user-email') userEmail: string,
  ) {
    // Service providers only see ratings for their own work
    // Other roles (manager, admin) see all ratings
    const providerEmail = role === 'service_provider' ? userEmail : undefined;
    return this.ratingsService.findAll(providerEmail);
  }
}
