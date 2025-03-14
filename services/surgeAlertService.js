const moment = require('moment');
const { Handle, Reply, SurgeAlertConfig, SurgeAlert } = require('../models');
const { Op } = require('sequelize');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

class SurgeAlertService {
    static async getThroughputMetrics(handleId) {
        const now = moment();
        const fifteenMinutesAgo = moment().subtract(15, 'minutes');
        const hourAgo = moment().subtract(1, 'hour');
        const dayAgo = moment().subtract(24, 'hours');

        try {
            const [fifteenMinCount, hourCount, dayCount] = await Promise.all([
                Reply.count({
                    where: {
                        HandleId: handleId,
                        isHidden: true,
                        hiddenAt: {
                            [Op.gte]: fifteenMinutesAgo.toDate()
                        }
                    }
                }),
                Reply.count({
                    where: {
                        HandleId: handleId,
                        isHidden: true,
                        hiddenAt: {
                            [Op.gte]: hourAgo.toDate()
                        }
                    }
                }),
                Reply.count({
                    where: {
                        HandleId: handleId,
                        isHidden: true,
                        hiddenAt: {
                            [Op.gte]: dayAgo.toDate()
                        }
                    }
                })
            ]);

            return {
                hidden_replies_last_15_min: fifteenMinCount,
                hidden_replies_last_hour: hourCount,
                hidden_replies_last_24_hours: dayCount
            };
        } catch (error) {
            logger.error('Error getting throughput metrics:', error);
            throw error;
        }
    }

    static async createConfig(handleId, data, createdBy) {
        try {
            const config = await SurgeAlertConfig.create({
                HandleId: handleId,
                surgeReplyCountPerPeriod: data.surge_reply_count_per_period,
                surgeReplyPeriodInMs: data.surge_reply_period_in_ms,
                alertCooldownPeriodInMs: data.alert_cooldown_period_in_ms || 900000, // Default 15 minutes
                emailsToNotify: data.emails_to_notify,
                enabled: data.enabled ?? true,
                createdBy: createdBy
            });

            return config;
        } catch (error) {
            logger.error('Error creating surge alert config:', error);
            throw error;
        }
    }

    static async updateConfig(configId, data, updatedBy) {
        try {
            const config = await SurgeAlertConfig.findByPk(configId);
            if (!config) {
                return null;
            }

            await config.update({
                surgeReplyCountPerPeriod: data.surge_reply_count_per_period ?? config.surgeReplyCountPerPeriod,
                surgeReplyPeriodInMs: data.surge_reply_period_in_ms ?? config.surgeReplyPeriodInMs,
                alertCooldownPeriodInMs: data.alert_cooldown_period_in_ms ?? config.alertCooldownPeriodInMs,
                emailsToNotify: data.emails_to_notify ?? config.emailsToNotify,
                enabled: data.enabled ?? config.enabled,
                updatedBy: updatedBy
            });

            return config;
        } catch (error) {
            logger.error('Error updating surge alert config:', error);
            throw error;
        }
    }

    static async getConfigs(handleId) {
        try {
            return await SurgeAlertConfig.findAll({
                where: { HandleId: handleId }
            });
        } catch (error) {
            logger.error('Error getting surge alert configs:', error);
            throw error;
        }
    }

    static async evaluateSurges() {
        try {
            logger.info('Starting surge evaluation...');
            const configs = await SurgeAlertConfig.findAll({
                where: { enabled: true },
                include: [Handle]
            });

            logger.info(`Found ${configs.length} active configurations to evaluate`);
            const now = moment();
            const results = [];

            for (const config of configs) {
                logger.info(`Evaluating config ${config.id} for handle ${config.Handle?.handle}`);
                const periodStart = moment().subtract(config.surgeReplyPeriodInMs, 'milliseconds');

                // Count hidden replies in the period
                const hiddenCount = await Reply.count({
                    where: {
                        HandleId: config.HandleId,
                        isHidden: true,
                        hiddenAt: {
                            [Op.gte]: periodStart.toDate()
                        }
                    }
                });

                logger.info(`Found ${hiddenCount} hidden replies in the last ${config.surgeReplyPeriodInMs}ms (threshold: ${config.surgeReplyCountPerPeriod})`);

                if (hiddenCount >= config.surgeReplyCountPerPeriod) {
                    logger.info('Threshold exceeded, checking cooldown period...');
                    // Check cooldown period
                    const lastAlert = await SurgeAlert.findOne({
                        where: { configId: config.id },
                        order: [['createdAt', 'DESC']]
                    });

                    let cooldownPassed = true;
                    if (lastAlert && config.alertCooldownPeriodInMs) {
                        const cooldownEnd = moment(lastAlert.createdAt)
                            .add(config.alertCooldownPeriodInMs, 'milliseconds');
                        cooldownPassed = now.isAfter(cooldownEnd);
                        logger.info(`Cooldown period ${cooldownPassed ? 'has passed' : 'is still active'}`);
                    }

                    if (cooldownPassed) {
                        logger.info('Creating new surge alert...');
                        // Create new surge alert
                        const alert = await SurgeAlert.create({
                            configId: config.id,
                            surgeAmount: hiddenCount,
                            configSnapshot: {
                                surge_reply_count_per_period: config.surgeReplyCountPerPeriod,
                                surge_reply_period_in_ms: config.surgeReplyPeriodInMs,
                                alert_cooldown_period_in_ms: config.alertCooldownPeriodInMs,
                                emails_to_notify: config.emailsToNotify
                            }
                        });
                        results.push(alert);
                        logger.info(`Created surge alert with ID ${alert.id}`);
                    }
                }

                // Update last evaluated timestamp
                await config.update({ lastEvaluatedAt: now.toDate() });
            }

            logger.info(`Surge evaluation complete. Created ${results.length} new alerts.`);
            return results;
        } catch (error) {
            logger.error('Error evaluating surges:', error);
            throw error;
        }
    }

    static async getPendingAlerts() {
        try {
            return await SurgeAlert.findAll({
                where: { alertedAt: null },
                include: [{
                    model: SurgeAlertConfig,
                    include: [Handle]
                }]
            });
        } catch (error) {
            logger.error('Error getting pending alerts:', error);
            throw error;
        }
    }

    static async markAlertSent(alertId) {
        try {
            const alert = await SurgeAlert.findByPk(alertId);
            if (alert) {
                await alert.update({ alertedAt: moment().toDate() });
            }
        } catch (error) {
            logger.error('Error marking alert as sent:', error);
            throw error;
        }
    }
}

module.exports = SurgeAlertService;