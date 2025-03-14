const { Handle, Reply, DenyWord } = require('../models');
const { logger } = require('../config/logger');
const { Op } = require('sequelize');

class ReplyService {
    static async storeReply(handle, replyId, content) {
        try {
            // Find handle
            const handleObj = await Handle.findOne({ where: { handle } });
            if (!handleObj) {
                throw new Error('Handle not found');
            }

            // Check if reply should be hidden based on deny words
            const denyWords = await DenyWord.findAll({
                where: { HandleId: handleObj.id }
            });

            let isHidden = false;
            let hiddenByWord = null;

            for (const denyWord of denyWords) {
                if (content.toLowerCase().includes(denyWord.word.toLowerCase())) {
                    isHidden = true;
                    hiddenByWord = denyWord.word;
                    break;
                }
            }

            // Create reply
            const reply = await Reply.create({
                replyId,
                content,
                isHidden,
                hiddenAt: isHidden ? new Date() : null,
                hiddenByWord,
                HandleId: handleObj.id
            });

            return reply;
        } catch (error) {
            logger.error('Error storing reply:', error);
            throw error;
        }
    }

    static async addDenyWord(handle, word) {
        try {
            // Find handle
            const handleObj = await Handle.findOne({ where: { handle } });
            if (!handleObj) {
                throw new Error('Handle not found');
            }

            // Create deny word
            const denyWord = await DenyWord.create({
                word,
                HandleId: handleObj.id
            });

            // Find and hide existing replies containing this word
            const replies = await Reply.findAll({
                where: {
                    HandleId: handleObj.id,
                    isHidden: false,
                    content: {
                        [Op.iLike]: `%${word}%`
                    }
                }
            });

            const nowDate = new Date();
            const hiddenReplies = await Promise.all(
                replies.map(reply =>
                    reply.update({
                        isHidden: true,
                        hiddenAt: nowDate,
                        hiddenByWord: word
                    })
                )
            );

            return [denyWord, hiddenReplies];
        } catch (error) {
            logger.error('Error adding deny word:', error);
            throw error;
        }
    }

    static async getHiddenReplies(handle) {
        try {
            const handleObj = await Handle.findOne({ where: { handle } });
            if (!handleObj) {
                throw new Error('Handle not found');
            }

            return await Reply.findAll({
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
