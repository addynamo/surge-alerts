const validateReply = (req, res, next) => {
  const { handle, content } = req.body;

  if (!handle || typeof handle !== 'string' || handle.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid handle' });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid content' });
  }

  next();
};

const validateSurgeConfig = (req, res, next) => {
  const { threshold, timeWindow } = req.body;

  if (!Number.isInteger(threshold) || threshold <= 0) {
    return res.status(400).json({ error: 'Threshold must be a positive integer' });
  }

  if (!Number.isInteger(timeWindow) || timeWindow <= 0) {
    return res.status(400).json({ error: 'Time window must be a positive integer' });
  }

  next();
};

module.exports = {
  validateReply,
  validateSurgeConfig
};
