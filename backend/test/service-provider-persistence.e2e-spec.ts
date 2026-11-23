import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { basename, join } from 'path';
import { existsSync, readdirSync, unlinkSync } from 'fs';
import { AppModule } from '../src/app.module';
import { validationPipe } from '../src/common/pipes/validation.pipe';
import { EstimatesService } from '../src/modules/estimates/estimates.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

const pdf = Buffer.from('%PDF-1.4 estimate test');
const uploadPath = join(process.cwd(), 'uploads', 'estimates');
const files = () => existsSync(uploadPath) ? readdirSync(uploadPath).sort() : [];

describe('Complaint estimate applications (HTTP)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.useGlobalPipes(validationPipe);
    await app.init();
    await request(app.getHttpServer()).patch('/complaints/1/status').set('role', 'maintenance_manager')
      .set('x-user-id', '5').send({ status: 'approved', deadline: '2026-12-01' }).expect(200);
  });
  afterEach(async () => {
    for (const e of app.get(EstimatesService).findAll()) {
      if (e.id >= 8 && e.documentUrl) {
        const path = join(uploadPath, basename(e.documentUrl));
        if (existsSync(path)) unlinkSync(path);
      }
    }
    await app.close();
  });
  const submit = (providerId: number, cost = '2500', complaintId = '1') => request(app.getHttpServer())
    .post('/estimates').set('role', 'service_provider').set('x-user-id', String(providerId))
    .field('complaintId', complaintId).field('providerId', String(providerId)).field('estimatedCost', cost)
    .field('notes', 'Pipe repair and fitting').attach('document', pdf, 'estimate.pdf');
  const queue = () => request(app.getHttpServer()).get('/complaints/1/queue')
    .set('role', 'maintenance_manager').set('x-user-id', '5');

  it('compares three real estimates, selects B atomically, protects work and completes payment', async () => {
    const a = (await submit(9, '3000').expect(201)).body;
    const b = (await submit(10, '2500').expect(201)).body;
    const c = (await submit(11, '3500').expect(201)).body;
    const waiting = (await queue().expect(200)).body;
    expect(waiting.queue).toEqual([9, 10, 11]);
    expect(waiting.applications.map(a => a.estimate.estimatedCost)).toEqual([3000, 2500, 3500]);
    const complaint = (await request(app.getHttpServer()).get('/complaints/1').set('role', 'service_provider').expect(200)).body;
    expect(complaint.status).toBe('approved');
    expect(complaint.assignedProviderId).toBeUndefined();
    expect(complaint.estimateApproved).toBeUndefined();
    const selected = (await request(app.getHttpServer()).patch('/complaints/1/assign/10')
      .set('role', 'maintenance_manager').set('x-user-id', '5')
      .send({ deadline: '2026-12-04', managerNote: 'Best quote' }).expect(200)).body;
    expect(selected).toMatchObject({ assignedProviderId: 10, estimateApproved: true, estimateSubmitted: true, status: 'in_progress', deadline: '2026-12-04' });
    const outcomes = (await queue().expect(200)).body.applications.map(a => a.estimate);
    expect(outcomes.find(e => e.id === b.id)).toMatchObject({ approved: true, selectionStatus: 'selected' });
    for (const e of [a, c]) expect(outcomes.find(x => x.id === e.id)).toMatchObject({ approved: null, selectionStatus: 'not_selected' });
    await request(app.getHttpServer()).patch('/complaints/1/assign/9').set('role', 'maintenance_manager').set('x-user-id', '5').send({}).expect(400);
    await submit(12).expect(400);
    for (const providerId of [9, 11]) {
      await request(app.getHttpServer()).patch('/complaints/1/status').set('role', 'service_provider')
        .set('x-user-id', String(providerId)).send({ status: 'estimating_cost' }).expect(403);
      await request(app.getHttpServer()).post('/bills').set('role', 'service_provider').set('x-user-id', String(providerId))
        .field('complaintId', '1').field('amount', '2500').attach('attachments', pdf, 'bill.pdf').expect(400);
    }
    const bill = (await request(app.getHttpServer()).post('/bills').set('role', 'service_provider').set('x-user-id', '10')
      .field('complaintId', '1').field('amount', '2500').field('description', 'Repair complete')
      .attach('attachments', pdf, 'bill.pdf').expect(201)).body;
    await request(app.getHttpServer()).patch(`/bills/${bill.id}/mark-paid`).set('role', 'maintenance_manager').expect(200);
    expect((await request(app.getHttpServer()).get('/complaints/1').set('role', 'service_provider')).body.status).toBe('closed');
    // Only files made by this test are removed.
    for (const url of bill.attachmentUrls) { const path = join(process.cwd(), 'uploads', 'bills', basename(url)); if (existsSync(path)) unlinkSync(path); }
  });

  it('rejects one candidate while leaving others available and preserving history', async () => {
    const a = (await submit(9).expect(201)).body;
    await submit(10).expect(201);
    await request(app.getHttpServer()).patch(`/estimates/${a.id}/review`).set('role', 'maintenance_manager').set('x-user-id', '5')
      .send({ approved: false, managerNote: 'Too expensive' }).expect(200);
    const result = (await queue().expect(200)).body;
    expect(result.queue).toEqual([10]);
    expect(result.applications.find(a => a.provider.id === 9).estimate.selectionStatus).toBe('rejected');
    expect((await request(app.getHttpServer()).get('/complaints/1').set('role', 'service_provider')).body.status).toBe('approved');
    await request(app.getHttpServer()).patch('/complaints/1/assign/10').set('role', 'maintenance_manager').set('x-user-id', '5').send({}).expect(200);
  });

  it('protects estimates and documents from competing providers and unrelated managers', async () => {
    const a = (await submit(9).expect(201)).body;
    await submit(10).expect(201);
    const own = (await request(app.getHttpServer()).get('/estimates?complaintId=1').set('role', 'service_provider').set('x-user-id', '9').expect(200)).body;
    expect(own.map(e => e.providerId)).toEqual([9]);
    await request(app.getHttpServer()).get(`/estimates/${a.id}`).set('role', 'service_provider').set('x-user-id', '10').expect(403);
    await request(app.getHttpServer()).get(`/estimates/${a.id}/document`).set('role', 'service_provider').set('x-user-id', '10').expect(403);
    await request(app.getHttpServer()).get(`/estimates/${a.id}/document`).set('role', 'service_provider').set('x-user-id', '9').expect(200);
    await request(app.getHttpServer()).get('/complaints/1/queue').set('role', 'maintenance_manager').set('x-user-id', '6').expect(403);
    await request(app.getHttpServer()).patch('/complaints/1/assign/9').set('role', 'maintenance_manager').set('x-user-id', '6').send({}).expect(403);
    await request(app.getHttpServer()).patch(`/estimates/${a.id}/review`).set('role', 'maintenance_manager').set('x-user-id', '6').send({ approved: true }).expect(403);
  });

  it('blocks missing fields, identity mismatch, invalid files and oversized files without side effects', async () => {
    const before = files();
    await request(app.getHttpServer()).patch('/complaints/1/sp-interest').set('role', 'service_provider').set('x-user-id', '9').send({ providerId: 9 }).expect(400);
    await request(app.getHttpServer()).post('/estimates').set('role', 'service_provider').set('x-user-id', '9')
      .field('complaintId', '1').field('providerId', '9').field('estimatedCost', '2500').field('notes', 'Repair').expect(400);
    await submit(9, '0').expect(400);
    await request(app.getHttpServer()).post('/estimates').set('role', 'service_provider').set('x-user-id', '10')
      .field('complaintId', '1').field('providerId', '9').field('estimatedCost', '2500').field('notes', 'Repair').attach('document', pdf, 'estimate.pdf').expect(400);
    await request(app.getHttpServer()).post('/estimates').set('role', 'service_provider').set('x-user-id', '9')
      .field('complaintId', '1').field('providerId', '9').field('estimatedCost', '2500').field('notes', 'Repair').attach('document', pdf, 'estimate.exe').expect(400);
    await request(app.getHttpServer()).post('/estimates').set('role', 'service_provider').set('x-user-id', '9')
      .field('complaintId', '1').field('providerId', '9').field('estimatedCost', '2500').field('notes', 'Repair')
      .attach('document', Buffer.alloc(5 * 1024 * 1024 + 1), 'estimate.pdf').expect(413);
    expect((await queue()).body.applications).toEqual([]);
    expect(files()).toEqual(before);
  });

  it('cleans up duplicate/retry uploads and server failures, then permits a valid retry', async () => {
    await submit(9).expect(201);
    const before = files();
    await submit(9).expect(400);
    expect(files()).toEqual(before);
    const notifications = app.get(NotificationsService);
    jest.spyOn(notifications, 'create').mockImplementationOnce(() => { throw new Error('Storage failure'); });
    await submit(10).expect(500);
    expect(files()).toEqual(before);
    expect((await queue()).body.queue).toEqual([9]);
    await submit(10).expect(201);
    expect((await queue()).body.queue).toEqual([9, 10]);
  });

  it('preserves provider declines and supports assigned/seeded legacy estimates', async () => {
    await request(app.getHttpServer()).patch('/complaints/1/sp-reject').set('role', 'service_provider').set('x-user-id', '9')
      .send({ providerId: 9, reason: 'Unavailable' }).expect(200);
    await submit(9).expect(400);
    expect((await queue()).body.queue).toEqual([]);
    const legacy = (await submit(10, '1500', '4').expect(201)).body;
    await request(app.getHttpServer()).patch(`/estimates/${legacy.id}/review`).set('role', 'maintenance_manager').set('x-user-id', '6')
      .send({ approved: true }).expect(200);
    await request(app.getHttpServer()).patch('/estimates/1/review').set('role', 'maintenance_manager').set('x-user-id', '7')
      .send({ approved: true }).expect(200);
    const complaint = (await request(app.getHttpServer()).get('/complaints/3').set('role', 'service_provider')).body;
    expect(complaint).toMatchObject({ status: 'in_progress', assignedProviderId: 12, estimateApproved: true });
  });
});
