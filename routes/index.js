const express = require('express');
const { Handle, Reply, SurgeAlertConfig, SurgeAlert } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const emailService = require('../services/emailService');

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Store new replies
router.post('/api/replies', async (req, res) => {
  try {
    const { handle, content } = req.body;
    
    if (!handle || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create handle
    const [handleRecord] = await Handle.findOrCreate({
      where: { handle }
    });

    // Create reply
    const reply = await Reply.create({
      HandleId: handleRecord.id,
      content
    });

    // Check for surge
    await checkForSurge(handleRecord.id);

    res.status(201).json({
      id: reply.id,
      handle,
      content: reply.content,
      createdAt: reply.createdAt
    });
  } catch (error) {
    logger.error(`Error creating reply: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get replies for a handle
router.get('/api/handles/:handle/replies', async (req, res) => {
  try {
    const { handle } = req.params;
    const handleRecord = await Handle.findOne({
      where: { handle }
    });

    if (!handleRecord) {
      return res.status(404).json({ error: 'Handle not found' });
    }

    const replies = await Reply.findAll({
      where: { HandleId: handleRecord.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt
    })));
  } catch (error) {
    logger.error(`Error getting replies: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create surge alert configuration
router.post('/api/surge-alert/:handle/config', async (req, res) => {
  try {
    const { handle } = req.params;
    const { threshold, timeWindow } = req.body;

    if (!threshold || !timeWindow) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [handleRecord] = await Handle.findOrCreate({
      where: { handle }
    });

    const config = await SurgeAlertConfig.create({
      HandleId: handleRecord.id,
      threshold,
      timeWindow
    });

    res.status(201).json({
      handle,
      threshold: config.threshold,
      timeWindow: config.timeWindow,
      createdAt: config.createdAt
    });
  } catch (error) {
    logger.error(`Error creating surge config: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get throughput metrics
router.get('/api/surge-alert/throughput/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const handleRecord = await Handle.findOne({
      where: { handle }
    });

    if (!handleRecord) {
      return res.status(404).json({ error: 'Handle not found' });
    }

    const now = new Date();
    const hourAgo = new Date(now - 60 * 60 * 1000);

    const hourlyCount = await Reply.count({
      where: {
        HandleId: handleRecord.id,
        createdAt: {
          [Op.gte]: hourAgo
        }
      }
    });

    const totalCount = await Reply.count({
      where: { HandleId: handleRecord.id }
    });

    res.json({
      handle,
      hourlyCount,
      totalCount
    });
  } catch (error) {
    logger.error(`Error getting metrics: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function checkForSurge(handleId) {
  try {
    const config = await SurgeAlertConfig.findOne({
      where: { HandleId: handleId }
    });

    if (!config) return;

    const now = new Date();
    const windowStart = new Date(now - config.timeWindow * 60 * 1000);

    const replyCount = await Reply.count({
      where: {
        HandleId: handleId,
        createdAt: {
          [Op.gte]: windowStart
        }
      }
    });

    if (replyCount >= config.threshold) {
      await SurgeAlert.create({
        HandleId: handleId,
        replyCount
      });

      // Send email notification
      await emailService.sendSurgeAlert(handleId, replyCount);
    }
  } catch (error) {
    logger.error(`Error checking for surge: ${error.message}`);
  }
}

module.exports = router;
