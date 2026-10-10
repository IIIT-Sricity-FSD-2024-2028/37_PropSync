import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { validationPipe } from './../src/common/pipes/validation.pipe';

describe('Service Provider State Persistence E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(validationPipe);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Provider A accepts Complaint 2 -> complaint remains visible and tracks provider interest', async () => {
    // 1. Complaint 2 has status approved and interestedProviders: [10]
    // Provider 9 (QuickFix Plumbing) accepts Complaint 2
    const acceptRes = await request(app.getHttpServer())
      .patch('/complaints/2/sp-interest')
      .set('role', 'service_provider')
      .set('x-user-id', '9')
      .send({ providerId: 9 })
      .expect(200);

    expect(acceptRes.body.queue).toContain(9);
    expect(acceptRes.body.queue).toContain(10);

    // 2. Fetch all complaints for Provider 9 -> Complaint 2 is STILL visible
    const allComplaints = await request(app.getHttpServer())
      .get('/complaints')
      .set('role', 'service_provider')
      .expect(200);

    const comp2 = allComplaints.body.find((c: any) => c.id === 2);
    expect(comp2).toBeDefined();
    expect(comp2.status).toBe('approved');
    expect(comp2.interestedProviders).toContain(9);

    // 3. Provider 9 accepts Complaint 2 again -> idempotent, no error, no duplicates
    const reAcceptRes = await request(app.getHttpServer())
      .patch('/complaints/2/sp-interest')
      .set('role', 'service_provider')
      .set('x-user-id', '9')
      .send({ providerId: 9 })
      .expect(200);

    expect(reAcceptRes.body.queue.filter((id: number) => id === 9).length).toBe(1);

    // 4. Provider 11 also sees Complaint 2 as available
    const comp2For11 = (await request(app.getHttpServer())
      .get('/complaints/2')
      .set('role', 'service_provider')
      .expect(200)).body;

    expect(comp2For11.status).toBe('approved');
    expect(comp2For11.interestedProviders.includes(11)).toBe(false);

    // 5. Provider 11 accepts Complaint 2
    await request(app.getHttpServer())
      .patch('/complaints/2/sp-interest')
      .set('role', 'service_provider')
      .set('x-user-id', '11')
      .send({ providerId: 11 })
      .expect(200);

    const comp2After = (await request(app.getHttpServer())
      .get('/complaints/2')
      .set('role', 'service_provider')
      .expect(200)).body;

    expect(comp2After.interestedProviders).toContain(11);

    // 6. Maintenance Manager sees all interested providers in queue
    const queueRes = await request(app.getHttpServer())
      .get('/complaints/2/queue')
      .set('role', 'maintenance_manager')
      .expect(200);

    expect(queueRes.body.queue).toContain(9);
    expect(queueRes.body.queue).toContain(10);
    expect(queueRes.body.queue).toContain(11);
  });

  it('Provider A rejects an available complaint -> rejection persists and complaint remains in list', async () => {
    // Provider 9 rejects Complaint 8 (Approved)
    const rejectRes = await request(app.getHttpServer())
      .patch('/complaints/8/sp-reject')
      .set('role', 'service_provider')
      .set('x-user-id', '9')
      .send({ providerId: 9, reason: 'Too far' })
      .expect(200);

    expect(rejectRes.body.rejectedProviders).toContain(9);

    // Fetch complaint 8 details -> reflects rejection for provider 9
    const detailRes = await request(app.getHttpServer())
      .get('/complaints/8')
      .set('role', 'service_provider')
      .expect(200);

    expect(detailRes.body.rejectedProviders).toContain(9);
    expect(detailRes.body.status).toBe('approved');
  });
});
