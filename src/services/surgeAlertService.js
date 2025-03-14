const { SurgeAlertConfig, SurgeAlert, Reply, Handle } = require('../models');
const EmailService = require('./emailService');
const logger = require('../config/logger');
const { Op } = require('sequelize');

class SurgeAlertService {
  static async createConfig(handle, threshold, timeWindow) {
    try {
      const [handleRecord] = await Handle.findOrCreate({
        where: { handle }
      });

      const config = await SurgeAlertConfig.create({
        HandleId: handleRecord.id,
        threshold,
        timeWindow
      });

      logger.info(`Created surge alert config for handle: ${handle}`);
      return config;
    } catch (error) {
      logger.error(`Error creating surge config for ${handle}: ${error.message}`);
      throw error;
    }
  }

  static async checkForSurge(handle) {
    try {
      const handleRecord = await Handle.findOne({
        where: { handle }
      });

      if (!handleRecord) {
        logger.info(`No handle found for: ${handle}`);
        return null;
      }

      const config = await SurgeAlertConfig.findOne({
        where: { HandleId: handleRecord.id }
      });

      if (!config) {
        logger.info(`No surge config found for handle: ${handle}`);
        return null;
      }

      const now = new Date();
      const windowStart = new Date(now - config.timeWindow * 60 * 1000);

      const repliesCount = await Reply.count({
        where: {
          HandleId: handleRecord.id,
          createdAt: {
            [Op.between]: [windowStart, now]
          }
        }
      });

      if (repliesCount >= config.threshold) {
        const alert = await SurgeAlert.create({
          HandleId: handleRecord.id,
          replyCount: repliesCount
        });

        logger.info(`Surge detected for handle ${handle}: ${repliesCount} replies`);

        // Send notification
        await EmailService.sendSurgeAlert(handleRecord.id, repliesCount);

        return alert;
      }

      return null;
    } catch (error) {
      logger.error(`Error checking surge for ${handle}: ${error.message}`);
      throw error;
    }
  }

  static async getThroughputMetrics(handle) {
    try {
      const handleRecord = await Handle.findOne({
        where: { handle }
      });

      if (!handleRecord) {
        return {
          handle,
          hourlyCount: 0,
          totalCount: 0
        };
      }

      const now = new Date();
      const hourAgo = new Date(now - 60 * 60 * 1000);

      const [hourlyCount, totalCount] = await Promise.all([
        Reply.count({
          where: {
            HandleId: handleRecord.id,
            createdAt: {
              [Op.between]: [hourAgo, now]
            }
          }
        }),
        Reply.count({
          where: { HandleId: handleRecord.id }
        })
      ]);

      return {
        handle,
        hourlyCount,
        totalCount
      };
    } catch (error) {
      logger.error(`Error getting metrics for ${handle}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SurgeAlertService;