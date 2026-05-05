import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API health info', () => {
      const result = appController.getInfo();
      expect(result.name).toBe('PropSync API');
      expect(result.status).toBe('running');
      expect(result.modules).toBeDefined();
    });
  });
});
