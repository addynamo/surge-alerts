const { Reply, Handle } = require('../models');
const logger = require('../config/logger');

class ReplyService {
  static async createReply(handle, content) {
    try {
      // Create handle if it doesn't exist
      const [handleRecord] = await Handle.findOrCreate({
        where: { handle }
      });

      const reply = await Reply.create({
        HandleId: handleRecord.id,
        content
      });

      logger.info(`Created new reply for handle: ${handle}`);
      return reply;
    } catch (error) {
      logger.error(`Error creating reply for handle ${handle}: ${error.message}`);
      throw error;
    }
  }

  static async getRepliesForHandle(handle) {
    try {
      const handleRecord = await Handle.findOne({
        where: { handle }
      });

      if (!handleRecord) {
        return [];
      }

      const replies = await Reply.findAll({
        where: { HandleId: handleRecord.id },
        order: [['createdAt', 'DESC']]
      });

      logger.info(`Retrieved ${replies.length} replies for handle: ${handle}`);
      return replies;
    } catch (error) {
      logger.error(`Error getting replies for handle ${handle}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ReplyService;