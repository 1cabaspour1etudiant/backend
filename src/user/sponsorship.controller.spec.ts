import { Test, TestingModule } from '@nestjs/testing';
import { SponsorshipController } from './sponsorship.controller';

describe('SponsorshipController', () => {
  let controller: SponsorshipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorshipController],
    }).compile();

    controller = module.get<SponsorshipController>(SponsorshipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
