const SurgeAlertService = require('../../src/services/surgeAlertService');
const { Reply, SurgeAlertConfig } = require('../../src/models');

describe('SurgeAlertService', () => {
  const testHandle = 'testuser';

  beforeEach(() => {
    // Clear any existing data
    jest.clearAllMocks();
  });

  describe('createConfig', () => {
    it('should create a surge alert configuration', async () => {
      const config = await SurgeAlertService.createConfig(testHandle, 5, 10);
      
      expect(config).toBeDefined();
      expect(config.handle).toBe(testHandle);
      expect(config.threshold).toBe(5);
      expect(config.timeWindow).toBe(10);
    });
  });

  describe('checkForSurge', () => {
    it('should detect surge when threshold is exceeded', async () => {
      // Create config
      await SurgeAlertService.createConfig(testHandle, 3, 5);

      // Create replies
      for (let i = 0; i < 4; i++) {
        Reply.create(testHandle, `test content ${i}`);
      }

      const result = await SurgeAlertService.checkForSurge(testHandle);
      
      expect(result).toBeDefined();
      expect(result.handle).toBe(testHandle);
      expect(result.count).toBe(4);
    });

    it('should not detect surge when below threshold', async () => {
      // Create config
      await SurgeAlertService.createConfig(testHandle, 5, 5);

      // Create replies
      for (let i = 0; i < 3; i++) {
        Reply.create(testHandle, `test content ${i}`);
      }

      const result = await SurgeAlertService.checkForSurge(testHandle);
      
      expect(result).toBeNull();
    });
  });

  describe('getThroughputMetrics', () => {
    it('should return correct metrics', async () => {
      // Create some replies
      for (let i = 0; i < 3; i++) {
        Reply.create(testHandle, `test content ${i}`);
      }

      const metrics = await SurgeAlertService.getThroughputMetrics(testHandle);
      
      expect(metrics).toBeDefined();
      expect(metrics.handle).toBe(testHandle);
      expect(metrics.totalCount).toBe(3);
      expect(metrics.hourlyCount).toBe(3);
    });
  });
});
