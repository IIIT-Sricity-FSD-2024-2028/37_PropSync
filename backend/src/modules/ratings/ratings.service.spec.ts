import { BadRequestException } from '@nestjs/common';
import { ComplaintsService } from '../complaints/complaints.service';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { RatingsService } from './ratings.service';
import { RatingsRepository } from './ratings.repository';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';

describe('RatingsService', () => {
  let service: RatingsService;

  beforeEach(() => {
    service = new RatingsService(
      new ComplaintsService(
        new ComplaintsRepository(),
        new UsersService(new UsersRepository()),
      ),
      new RatingsRepository(),
    );
  });

  it('rejects ratings for complaints that are not completed or closed', () => {
    expect(() =>
      service.create({
        ownerId: 2,
        complaintId: 4,
        score: 5,
        feedback: 'Trying to rate too early',
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts one owner rating for a closed complaint with an assigned provider', () => {
    service.remove(1);

    const rating = service.create({
      ownerId: 2,
      complaintId: 6,
      score: 4,
      feedback: 'Good work',
    });

    expect(rating).toMatchObject({
      ownerId: 2,
      complaintId: 6,
      score: 4,
      feedback: 'Good work',
    });
  });
});
