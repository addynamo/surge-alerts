const { Handle, Reply, DenyWord } = require('../models');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

class ReplyService {
    static async storeReply(handle, replyId, content) {
        try {
            // Get or create handle
            const [handleObj] = await Handle.findOrCreate({
                where: { handle }
            });

            // Check against existing denywords
            const denywords = await DenyWord.findAll({
                where: { HandleId: handleObj.id }
            });

            const reply = await Reply.create({
                replyId,
                content,
                HandleId: handleObj.id
            });

            // Check content against denywords
            for (const denyword of denywords) {
                if (content.toLowerCase().includes(denyword.word.toLowerCase())) {
                    reply.isHidden = true;
                    reply.hiddenAt = new Date();
                    reply.hiddenByWord = denyword.word;
                    await reply.save();
                    break;
                }
            }

            return reply;
        } catch (error) {
            logger.error('Error storing reply:', error);
            throw error;
        }
    }

    static async addDenyword(handle, word) {
        try {
            // Get or create handle
            const [handleObj] = await Handle.findOrCreate({
                where: { handle }
            });

            // Create denyword
            const denyword = await DenyWord.create({
                word,
                HandleId: handleObj.id
            });

            // Find and update existing replies that match
            const replies = await Reply.findAll({
                where: {
                    HandleId: handleObj.id,
                    isHidden: false
                }
            });

            const newlyHidden = [];
            for (const reply of replies) {
                if (reply.content.toLowerCase().includes(word.toLowerCase())) {
                    reply.isHidden = true;
                    reply.hiddenAt = new Date();
                    reply.hiddenByWord = word;
                    await reply.save();
                    newlyHidden.push(reply);
                }
            }

            return { denyword, newlyHidden };
        } catch (error) {
            logger.error('Error adding denyword:', error);
            throw error;
        }
    }

    static async getHiddenReplies(handle) {
        try {
            const handleObj = await Handle.findOne({
                where: { handle }
            });

            if (!handleObj) {
                return [];
            }

            return Reply.findAll({
                where: {
                    HandleId: handleObj.id,
                    isHidden: true
                },
                order: [['hiddenAt', 'DESC']]
            });
        } catch (error) {
            logger.error('Error getting hidden replies:', error);
            throw error;
        }
    }
}

module.exports = ReplyService;
