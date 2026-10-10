import { Injectable } from '@nestjs/common';
import type { Rating } from './ratings.service';

@Injectable()
export class RatingsRepository {
  private ratings: Rating[] = [
    {
      id: 1,
      ownerId: 2,
      complaintId: 6,
      score: 5,
      feedback: 'Excellent service! Resolved the electrical issue very quickly.',
      ratedAt: '2024-03-10',
    },
    {
      id: 2,
      ownerId: 1,
      complaintId: 11,
      score: 4,
      feedback: 'HVAC noise reduced and work was completed on time.',
      ratedAt: '2024-03-09',
    },
    {
      id: 3,
      ownerId: 3,
      complaintId: 12,
      score: 5,
      feedback: 'Garden waste was cleared neatly.',
      ratedAt: '2024-03-08',
    },
  ];

  private idCounter = 4;

  findAll(): Rating[] {
    return [...this.ratings];
  }

  findById(id: number): Rating | undefined {
    return this.ratings.find((rating) => rating.id === id);
  }

  create(rating: Omit<Rating, 'id'>): Rating {
    const newRating = { ...rating, id: this.idCounter++ };
    this.ratings.push(newRating);
    return newRating;
  }

  remove(id: number): boolean {
    const index = this.ratings.findIndex((rating) => rating.id === id);
    if (index === -1) return false;
    this.ratings.splice(index, 1);
    return true;
  }
}
