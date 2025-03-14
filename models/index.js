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

const SurgeAlertConfig = sequelize.define('SurgeAlertConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'id'
    },
    surgeReplyCountPerPeriod: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'surge_reply_count_per_period'
    },
    surgeReplyPeriodInMs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'surge_reply_period_in_ms'
    },
    alertCooldownPeriodInMs: {
        type: DataTypes.INTEGER,
        field: 'alert_cooldown_period_in_ms'
    },
    emailsToNotify: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'emails_to_notify'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    lastEvaluatedAt: {
        type: DataTypes.DATE,
        field: 'last_evaluated_at'
    },
    createdBy: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'created_by'
    },
    updatedBy: {
        type: DataTypes.STRING(36),
        field: 'updated_by'
    }
}, {
    tableName: 'reply_manager_surge_alert_config',
    indexes: [
        {
            fields: ['enabled']
        }
    ]
});

const SurgeAlert = sequelize.define('SurgeAlert', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    surgeAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'surge_amount'
    },
    alertedAt: {
        type: DataTypes.DATE,
        field: 'alerted_at'
    },
    configSnapshot: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'config_snapshot'
    }
}, {
    tableName: 'reply_manager_surge_alerts',
    indexes: [
        {
            fields: ['alerted_at']
        }
    ]
});

// Define relationships
Handle.hasMany(Reply);
Reply.belongsTo(Handle);

Handle.hasMany(DenyWord);
DenyWord.belongsTo(Handle);

Handle.hasMany(SurgeAlertConfig);
SurgeAlertConfig.belongsTo(Handle);

SurgeAlertConfig.hasMany(SurgeAlert, { foreignKey: 'config_id' });
SurgeAlert.belongsTo(SurgeAlertConfig, { foreignKey: 'config_id' });

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
    DenyWord,
    SurgeAlertConfig,
    SurgeAlert
};