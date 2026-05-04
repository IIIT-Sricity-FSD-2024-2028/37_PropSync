import { Injectable } from '@nestjs/common';
import { getRatings, getComplaints, getUsers } from '../data-store';

@Injectable()
export class RatingsService {
  findAll(providerEmail?: string) {
    const ratings = getRatings();
    const complaints = getComplaints();
    const users = getUsers();

    // Filter by provider email if provided
    const filtered = providerEmail
      ? ratings.filter((r) => r.providerEmail === providerEmail)
      : ratings;

    // Enrich each rating with complaint category/location and owner name
    return filtered.map((r) => {
      const complaint = complaints.find((c) => c.id === r.complaintId);
      const owner = users.find((u) => u.email === r.ratedBy);

      return {
        id: r.id,
        complaintId: r.complaintId,
        providerEmail: r.providerEmail,
        // Fields the frontend already uses
        serviceType: complaint?.category || 'General',
        rating: r.rating,
        comment: r.feedback,
        date: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '',
        location: complaint?.location || 'Unknown',
        ownerName: owner?.name || r.ratedBy,
        // Raw fields too
        feedback: r.feedback,
        ratedBy: r.ratedBy,
        createdAt: r.createdAt,
      };
    });
  }
}
