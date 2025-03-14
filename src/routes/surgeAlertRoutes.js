const express = require('express');
const { Handle } = require('../models');
const SurgeAlertService = require('../services/surgeAlertService');
const EmailService = require('../services/emailService');
const { logger } = require('../config/logger');

const router = express.Router();
const emailService = new EmailService();

// Get throughput metrics
router.get('/surge-alert/throughput/:handle', async (req, res) => {
    try {
        const handle = await Handle.findOne({ where: { handle: req.params.handle } });
        if (!handle) {
            return res.status(404).json({ error: 'Handle not found' });
        }

        const metrics = await SurgeAlertService.getThroughputMetrics(handle.id);
        res.json(metrics);
    } catch (error) {
        logger.error('Error getting throughput metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create surge alert configuration
router.post('/surge-alert/:handle/config', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }

        const handle = await Handle.findOne({ where: { handle: req.params.handle } });
        if (!handle) {
            return res.status(404).json({ error: 'Handle not found' });
        }

        const config = await SurgeAlertService.createConfig(
            handle.id,
            data,
            req.headers['x-user-id'] || 'system'
        );

        res.status(201).json({
            id: config.id,
            surge_reply_count_per_period: config.surgeReplyCountPerPeriod,
            surge_reply_period_in_ms: config.surgeReplyPeriodInMs,
            alert_cooldown_period_in_ms: config.alertCooldownPeriodInMs,
            emails_to_notify: config.emailsToNotify,
            enabled: config.enabled,
            created_at: config.createdAt
        });
    } catch (error) {
        logger.error('Error creating surge alert config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update surge alert configuration
router.put('/surge-alert/:handle/config/:configId', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }

        const handle = await Handle.findOne({ where: { handle: req.params.handle } });
        if (!handle) {
            return res.status(404).json({ error: 'Handle not found' });
        }

        const config = await SurgeAlertService.updateConfig(
            req.params.configId,
            data,
            req.headers['x-user-id'] || 'system'
        );

        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        res.json({
            id: config.id,
            surge_reply_count_per_period: config.surgeReplyCountPerPeriod,
            surge_reply_period_in_ms: config.surgeReplyPeriodInMs,
            alert_cooldown_period_in_ms: config.alertCooldownPeriodInMs,
            emails_to_notify: config.emailsToNotify,
            enabled: config.enabled,
            updated_at: config.updatedAt
        });
    } catch (error) {
        logger.error('Error updating surge alert config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all surge alert configurations
router.get('/surge-alert/:handle/config', async (req, res) => {
    try {
        const handle = await Handle.findOne({ where: { handle: req.params.handle } });
        if (!handle) {
            return res.status(404).json({ error: 'Handle not found' });
        }

        const configs = await SurgeAlertService.getConfigs(handle.id);
        res.json({
            configurations: configs.map(config => ({
                id: config.id,
                surge_reply_count_per_period: config.surgeReplyCountPerPeriod,
                surge_reply_period_in_ms: config.surgeReplyPeriodInMs,
                alert_cooldown_period_in_ms: config.alertCooldownPeriodInMs,
                emails_to_notify: config.emailsToNotify,
                enabled: config.enabled,
                created_at: config.createdAt,
                updated_at: config.updatedAt
            }))
        });
    } catch (error) {
        logger.error('Error getting surge alert configs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Process pending notifications
router.post('/surge-alert/notify', async (req, res) => {
    try {
        const alerts = await SurgeAlertService.getPendingAlerts();
        const processed = [];
        const failed = [];

        for (const alert of alerts) {
            if (!alert.SurgeAlertConfig?.Handle) {
                logger.error(`Handle not found for alert ${alert.id}`);
                failed.push(alert.id);
                continue;
            }

            const emailSent = await emailService.sendSurgeAlert(
                alert.SurgeAlertConfig.Handle.handle,
                alert.surgeAmount,
                alert.configSnapshot.surge_reply_count_per_period,
                alert.configSnapshot.surge_reply_period_in_ms / 1000 // Convert to seconds for display
            );

            if (emailSent) {
                await SurgeAlertService.markAlertSent(alert.id);
                processed.push(alert.id);
            } else {
                failed.push(alert.id);
            }
        }

        res.json({
            success: true,
            processed_alerts: processed,
            failed_alerts: failed
        });
    } catch (error) {
        logger.error('Error processing surge alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
