import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { validationPipe } from './../src/common/pipes/validation.pipe';

describe('PropSync Regression Fix — Multiple Administrators E2E', () => {
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

  describe('Part 1 & 6 — Maintenance Payments Endpoint & x-user-id Header', () => {
    it('loads maintenance payments for Manager A (Vijay Singh, id: 5)', async () => {
      const res = await request(app.getHttpServer())
        .get('/maintenance')
        .set('role', 'maintenance_manager')
        .set('x-user-id', '5')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rejects maintenance payments request when x-user-id is missing', async () => {
      await request(app.getHttpServer())
        .get('/maintenance')
        .set('role', 'maintenance_manager')
        .expect(400);
    });
  });

  describe('Part 2, 3, 4, 7 — Maintenance Manager Targets Existing Owners in Their Block & 5%/95% Revenue', () => {
    it('creates monthly charges only for Block A owners in Green Valley Society', async () => {
      const month = '2026-10';
      const createRes = await request(app.getHttpServer())
        .post('/maintenance/create')
        .set('role', 'maintenance_manager')
        .set('x-user-id', '5')
        .send({ month, amount: 2000 })
        .expect(201);

      expect(createRes.body.message).toContain('Block A');

      // Fetch payments for Manager 5
      const listRes = await request(app.getHttpServer())
        .get('/maintenance')
        .set('role', 'maintenance_manager')
        .set('x-user-id', '5')
        .expect(200);

      const octoberCharges = listRes.body.filter((p: any) => p.month === month);
      expect(octoberCharges.length).toBeGreaterThanOrEqual(1);

      // Verify that charges belong only to Block A owners (e.g. Raj Kumar, unit A-101)
      expect(octoberCharges.every((p: any) => p.ownerUnit.startsWith('A'))).toBe(true);

      // Verify Manager B (Block B, id: 6) does NOT see Manager 5's payments
      const managerBRes = await request(app.getHttpServer())
        .get('/maintenance')
        .set('role', 'maintenance_manager')
        .set('x-user-id', '6')
        .expect(200);

      expect(managerBRes.body.some((p: any) => p.ownerId === 1 && p.month === month)).toBe(false);

      // Test payment & revenue
      const paymentId = octoberCharges[0].id;
      await request(app.getHttpServer())
        .patch(`/maintenance/${paymentId}/pay`)
        .set('role', 'owner')
        .set('x-user-id', String(octoberCharges[0].ownerId))
        .expect(200);

      // Super User checks platform revenue (5% platform, 95% manager)
      const revRes = await request(app.getHttpServer())
        .get('/maintenance/revenue')
        .set('role', 'super_user')
        .set('x-user-id', '0')
        .expect(200);

      expect(revRes.body.revenuePercentage).toBe(5);
      expect(revRes.body.totalMaintenanceCollected).toBeGreaterThanOrEqual(2000);
      expect(revRes.body.platformRevenue).toBeGreaterThanOrEqual(100);
      expect(revRes.body.managerAmount).toBeGreaterThanOrEqual(1900);
    });
  });

  describe('Part 8, 9, 10 — Manage Participants with Multiple Community Administrators', () => {
    let secondAdminId: number;

    beforeAll(async () => {
      // Create and approve a second Administrator for Green Valley Society
      const signupRes = await request(app.getHttpServer())
        .post('/users')
        .set('role', 'owner')
        .send({
          name: 'Green Valley Admin Two',
          email: 'admin.gv2@propsync.com',
          password: 'password123',
          role: 'admin',
          communityName: 'Green Valley Society',
        })
        .expect(201);

      secondAdminId = signupRes.body.id;

      // Super User approves the new administrator
      await request(app.getHttpServer())
        .patch(`/users/${secondAdminId}/approve`)
        .set('role', 'super_user')
        .set('x-user-id', '0')
        .expect(200);
    });

    it('Admin A1 and Admin A2 both see all participants from Green Valley Society and no other community', async () => {
      const admin1Res = await request(app.getHttpServer())
        .get('/users')
        .set('role', 'admin')
        .set('x-user-id', '13')
        .expect(200);

      const admin2Res = await request(app.getHttpServer())
        .get('/users')
        .set('role', 'admin')
        .set('x-user-id', String(secondAdminId))
        .expect(200);

      // Both should see the exact same set of community participants
      const ids1 = admin1Res.body.map((u: any) => u.id).sort();
      const ids2 = admin2Res.body.map((u: any) => u.id).sort();
      expect(ids1).toEqual(ids2);

      // All returned users must belong to Green Valley Society
      expect(admin1Res.body.every((u: any) => u.communityName === 'Green Valley Society')).toBe(true);

      // They must NOT see Sunrise Residency (e.g. user 16) or Lakeview (e.g. user 24)
      expect(admin1Res.body.some((u: any) => u.id === 16)).toBe(false);
      expect(admin1Res.body.some((u: any) => u.id === 24)).toBe(false);
    });

    it('Admin B1 sees only Sunrise Residency participants', async () => {
      const adminB1Res = await request(app.getHttpServer())
        .get('/users')
        .set('role', 'admin')
        .set('x-user-id', '14')
        .expect(200);

      expect(adminB1Res.body.every((u: any) => u.communityName === 'Sunrise Residency')).toBe(true);
      expect(adminB1Res.body.some((u: any) => u.id === 1)).toBe(false);
    });
  });

  describe('Part 11, 12, 13, 14 — Signup Notifications Routing', () => {
    it('notifies BOTH Green Valley administrators on new Owner signup in Green Valley', async () => {
      const newOwnerRes = await request(app.getHttpServer())
        .post('/users')
        .set('role', 'owner')
        .send({
          name: 'New GV Owner',
          email: 'new.gv.owner@propsync.com',
          password: 'password123',
          role: 'owner',
          communityName: 'Green Valley Society',
          propertyUnit: 'A-102',
        })
        .expect(201);

      const ownerId = newOwnerRes.body.id;

      // Check notifications for Admin 13 (Admin A1)
      const admin1Notifs = await request(app.getHttpServer())
        .get('/notifications')
        .set('role', 'admin')
        .set('x-user-id', '13')
        .expect(200);

      expect(admin1Notifs.body.some((n: any) => n.relatedUserId === ownerId)).toBe(true);

      // Check notifications for Admin B1 (Sunrise) — should NOT have it
      const sunriseNotifs = await request(app.getHttpServer())
        .get('/notifications')
        .set('role', 'admin')
        .set('x-user-id', '14')
        .expect(200);

      expect(sunriseNotifs.body.some((n: any) => n.relatedUserId === ownerId)).toBe(false);
    });

    it('notifies Super User on new Administrator signup', async () => {
      const newAdminRes = await request(app.getHttpServer())
        .post('/users')
        .set('role', 'owner')
        .send({
          name: 'New Lakeview Admin',
          email: 'new.lakeview.admin@propsync.com',
          password: 'password123',
          role: 'admin',
          communityName: 'Lakeview Apartments',
        })
        .expect(201);

      const adminId = newAdminRes.body.id;

      // Super User checks notifications with x-user-id: 0
      const superUserNotifs = await request(app.getHttpServer())
        .get('/notifications')
        .set('role', 'super_user')
        .set('x-user-id', '0')
        .expect(200);

      expect(superUserNotifs.body.some((n: any) => n.relatedUserId === adminId)).toBe(true);
    });
  });
});
