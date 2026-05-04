import { Injectable, NotFoundException } from '@nestjs/common';
import { getComplaints, setComplaints, generateId, Complaint, Status } from '../data-store';

@Injectable()
export class ComplaintsService {
  findAll(role?: string, userEmail?: string): Complaint[] {
    const complaints = getComplaints();
    if (role === 'service_provider') {
      return complaints.filter((c) => {
        // Show complaints that are Approved (open to all SPs)
        // OR assigned to this specific service provider
        const isApproved = c.status === 'Approved';
        const isAssignedToMe = userEmail && c.assignedTo === userEmail;
        return isApproved || isAssignedToMe;
      });
    }
    return complaints;
  }

  findOne(id: string): Complaint {
    const complaint = getComplaints().find((c) => String(c.id) === id);
    if (!complaint) throw new NotFoundException(`Complaint ${id} not found`);
    return complaint;
  }

  create(data: Partial<Complaint>): Complaint {
    const complaints = getComplaints();
    const newComplaint: Complaint = {
      id: generateId('C', complaints),
      title: data.title || 'Untitled',
      description: data.description || '',
      category: data.category || 'General',
      status: 'Pending',
      priority: data.priority || 'Medium',
      location: data.location || 'Unknown',
      issuedBy: data.issuedBy || 'unknown@example.com',
      serviceProviderQueue: [],
      reportedDate: new Date().toISOString().split('T')[0],
      deadline: data.deadline || '',
      image: data.image || '',
    };
    setComplaints([...complaints, newComplaint]);
    return newComplaint;
  }

  updateStatus(id: string, status: Status, reason?: string, assignedTo?: string): Complaint {
    const complaints = getComplaints();
    const index = complaints.findIndex((c) => String(c.id) === id);
    if (index === -1) throw new NotFoundException(`Complaint ${id} not found`);

    const existing = complaints[index];

    // When a SP accepts (status = Assigned), update assignedTo AND add to queue
    let updatedQueue = existing.serviceProviderQueue || [];
    if (status === 'Assigned' && assignedTo && !updatedQueue.includes(assignedTo)) {
      updatedQueue = [...updatedQueue, assignedTo];
    }

    complaints[index] = {
      ...existing,
      status,
      ...(reason ? { rejectionReason: reason } : {}),
      ...(status === 'Assigned' && assignedTo ? { assignedTo } : {}),
      serviceProviderQueue: updatedQueue,
    };
    setComplaints(complaints);
    return complaints[index];
  }
}

