import { ComplaintsService } from '../complaints/complaints.service';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { ComplaintStatus } from '../complaints/dto/complaint.dto';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { EstimatesService } from './estimates.service';
import { EstimatesRepository } from './estimates.repository';

// Real repositories exercise shared identity, state transitions and rollback.
describe('Estimate applications', () => {
  let complaints: ComplaintsService;
  let estimates: EstimatesService;
  let repository: EstimatesRepository;
  let notifications: NotificationsService;
  const submit = (providerId: number, estimatedCost = 2500, complaintId = 1) => estimates.create({
    complaintId, providerId, estimatedCost, notes: 'Repair work', documentUrl: '/estimate.pdf',
  });
  beforeEach(() => {
    repository = new EstimatesRepository();
    notifications = new NotificationsService(new NotificationsRepository());
    complaints = new ComplaintsService(new ComplaintsRepository(), new UsersService(new UsersRepository()), notifications, repository);
    estimates = new EstimatesService(complaints, repository);
    complaints.updateStatus(1, { status: ComplaintStatus.Approved, deadline: '2026-12-01' }, 'maintenance_manager');
  });

  it('requires an estimate before joining the queue', () => {
    expect(() => complaints.spExpressInterest(1, 9)).toThrow(/submitting an estimate/);
    expect(complaints.findById(1).interestedProviders).toEqual([]);
  });
  it('keeps three applications open, then selects only B and approves their estimate', () => {
    const a = submit(9, 3000), b = submit(10, 2500), c = submit(11, 3500);
    const complaint = complaints.findById(1);
    expect(complaint.status).toBe('approved');
    expect(complaint.assignedProviderId).toBeUndefined();
    expect(complaint.estimateSubmitted).toBeUndefined();
    expect(complaint.estimateApproved).toBeUndefined();
    expect(complaints.getInterestedProviders(1).applications.map(a => a.estimate.estimatedCost)).toEqual([3000, 2500, 3500]);
    complaints.assignProvider(1, 10, { deadline: '2026-12-03', managerNote: 'Best option' });
    expect(complaint).toMatchObject({ status: 'in_progress', assignedProviderId: 10, estimateApproved: true, estimateSubmitted: true, deadline: '2026-12-03' });
    expect(b).toMatchObject({ approved: true, selectionStatus: 'selected', managerNote: 'Best option' });
    for (const e of [a, c]) expect(e).toMatchObject({ approved: null, selectionStatus: 'not_selected' });
    expect(() => complaints.assignProvider(1, 9)).toThrow();
    expect(() => complaints.updateStatus(1, { status: ComplaintStatus.Completed }, 'service_provider', 9)).toThrow(/assigned provider/);
    expect(notifications.findAll(10).some(n => n.message.includes('work can begin'))).toBe(true);
  });
  it('rejects one candidate without changing global state or another candidate', () => {
    const a = submit(9), b = submit(10);
    estimates.review(a.id, { approved: false, managerNote: 'Too high' });
    expect(a).toMatchObject({ approved: false, selectionStatus: 'rejected' });
    expect(b.approved).toBeNull();
    expect(complaints.findById(1).status).toBe('approved');
    expect(complaints.findById(1).interestedProviders).toEqual([10]);
    complaints.assignProvider(1, 10);
    expect(a.selectionStatus).toBe('rejected');
  });
  it('routes legacy review URLs through joint assignment for unassigned complaints', () => {
    const e = submit(9);
    estimates.review(e.id, { approved: true });
    expect(complaints.findById(1)).toMatchObject({ assignedProviderId: 9, estimateApproved: true, status: 'in_progress' });
  });
  it('rejects duplicate submissions, invalid data, non-provider identities and closed applications', () => {
    submit(9);
    expect(() => submit(9)).toThrow(/already been submitted/);
    expect(() => submit(10, 0)).toThrow();
    expect(() => submit(10, NaN)).toThrow();
    expect(() => submit(1)).toThrow();
    expect(complaints.findById(1).interestedProviders).toEqual([9]);
    complaints.assignProvider(1, 9);
    expect(() => submit(10)).toThrow(/not open/);
  });
  it('rolls back the estimate, queue and notifications when submission fails', () => {
    const initial = notifications.findAll().length;
    const create = jest.spyOn(notifications, 'create');
    create.mockImplementationOnce(() => { throw new Error('Storage unavailable'); });
    expect(() => submit(9)).toThrow('Storage unavailable');
    expect(estimates.findAll(1)).toEqual([]);
    expect(complaints.findById(1).interestedProviders).toEqual([]);
    expect(notifications.findAll()).toHaveLength(initial);
    create.mockRestore();
    expect(submit(9).approved).toBeNull();
  });
  it('rolls back selection and earlier notifications if a later notification fails', () => {
    const a = submit(9), b = submit(10);
    const initial = notifications.findAll().length;
    const original = notifications.create.bind(notifications);
    jest.spyOn(notifications, 'create').mockImplementationOnce(original).mockImplementationOnce(() => { throw new Error('Failure'); });
    expect(() => complaints.assignProvider(1, 10)).toThrow('Failure');
    expect(complaints.findById(1)).toMatchObject({ status: 'approved', interestedProviders: [9, 10] });
    expect(complaints.findById(1).assignedProviderId).toBeUndefined();
    for (const e of [a, b]) expect(e).toMatchObject({ approved: null, selectionStatus: 'candidate' });
    expect(notifications.findAll()).toHaveLength(initial);
  });
  it('does not mutate the queue if repository insertion fails', () => {
    jest.spyOn(repository, 'create').mockImplementation(() => { throw new Error('Write failure'); });
    expect(() => submit(9)).toThrow('Write failure');
    expect(complaints.findById(1).interestedProviders).toEqual([]);
  });
  it('requires queue membership, a valid estimate and deadline for selection', () => {
    expect(() => complaints.assignProvider(1, 9)).toThrow();
    submit(9);
    expect(() => complaints.assignProvider(1, 9, { deadline: 'invalid' })).toThrow();
    complaints.findById(1).interestedProviders = [];
    expect(() => complaints.assignProvider(1, 9)).toThrow();
  });
  it('protects active estimates from deletion while retaining historical admin deletion', () => {
    const a = submit(9), b = submit(10);
    expect(() => estimates.remove(a.id)).toThrow(/cannot be deleted/);
    estimates.review(a.id, { approved: false });
    expect(estimates.remove(a.id).message).toContain('deleted');
    complaints.assignProvider(1, 10);
    expect(() => estimates.remove(b.id)).toThrow(/cannot be deleted/);
  });
  it('preserves assigned legacy submission and seeded pending review', () => {
    submit(10, 1500, 4);
    expect(complaints.findById(4)).toMatchObject({ status: 'estimating_cost', estimateSubmitted: true });
    estimates.review(estimates.findAll(4)[0].id, { approved: true });
    estimates.review(1, { approved: true });
    expect(complaints.findById(3)).toMatchObject({ status: 'in_progress', assignedProviderId: 12, estimateApproved: true });
  });
  it('exposes only own estimates to providers and only assigned complaints to managers', () => {
    const a = submit(9), b = submit(10);
    expect(estimates.findVisible('service_provider', 9, 1)).toEqual([a]);
    expect(() => estimates.assertAccess(b, 'service_provider', 9)).toThrow();
    expect(() => estimates.findVisible('maintenance_manager', 6, 1)).toThrow();
    expect(estimates.findVisible('maintenance_manager', 5, 1)).toHaveLength(2);
  });
});
