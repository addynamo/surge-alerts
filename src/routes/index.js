const express = require('express');
const { validateReply, validateSurgeConfig } = require('../middleware/validation');
const ReplyService = require('../services/replyService');
const SurgeAlertService = require('../services/surgeAlertService');
const logger = require('../config/logger');

const router = express.Router();

// Store new replies
router.post('/api/replies', validateReply, async (req, res, next) => {
  try {
    const { handle, content } = req.body;
    const reply = await ReplyService.createReply(handle, content);
    
    // Check for surge after new reply
    await SurgeAlertService.checkForSurge(handle);
    
    res.status(201).json(reply);
  } catch (error) {
    next(error);
  }
});

// Get replies for a handle
router.get('/api/handles/:handle/replies', async (req, res, next) => {
  try {
    const { handle } = req.params;
    const replies = await ReplyService.getRepliesForHandle(handle);
    res.json(replies);
  } catch (error) {
    next(error);
  }
});

// Create surge alert configuration
router.post('/api/surge-alert/:handle/config', validateSurgeConfig, async (req, res, next) => {
  try {
    const { handle } = req.params;
    const { threshold, timeWindow } = req.body;
    const config = await SurgeAlertService.createConfig(handle, threshold, timeWindow);
    res.status(201).json(config);
  } catch (error) {
    next(error);
  }
});

// Get throughput metrics
router.get('/api/surge-alert/throughput/:handle', async (req, res, next) => {
  try {
    const { handle } = req.params;
    const metrics = await SurgeAlertService.getThroughputMetrics(handle);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
