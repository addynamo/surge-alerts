const { Sequelize, DataTypes } = require('sequelize');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: msg => logger.debug(msg),
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const Handle = sequelize.define('Handle', {
    handle: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
});

const Reply = sequelize.define('Reply', {
    replyId: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
        field: 'reply_id'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isHidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_hidden'
    },
    hiddenAt: {
        type: DataTypes.DATE,
        field: 'hidden_at'
    },
    hiddenByWord: {
        type: DataTypes.STRING(255),
        field: 'hidden_by_word'
    }
});

const DenyWord = sequelize.define('DenyWord', {
    word: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
});

// Define relationships
Handle.hasMany(Reply);
Reply.belongsTo(Handle);

Handle.hasMany(DenyWord);
DenyWord.belongsTo(Handle);

// Add unique constraint for word per handle
DenyWord.addHook('beforeValidate', async (denyword) => {
    const existing = await DenyWord.findOne({
        where: {
            word: denyword.word,
            HandleId: denyword.HandleId
        }
    });
    if (existing) {
        throw new Error('Word already exists for this handle');
    }
});

module.exports = {
    sequelize,
    Handle,
    Reply,
    DenyWord
};
