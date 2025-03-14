const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../config/logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

const Handle = sequelize.define('Handle', {
  handle: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
});

const Reply = sequelize.define('Reply', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
});

const SurgeAlertConfig = sequelize.define('SurgeAlertConfig', {
  threshold: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeWindow: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
});

const SurgeAlert = sequelize.define('SurgeAlert', {
  replyCount: {
    type: DataTypes.INTEGER,
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

Handle.hasOne(SurgeAlertConfig);
SurgeAlertConfig.belongsTo(Handle);

Handle.hasMany(SurgeAlert);
SurgeAlert.belongsTo(Handle);

module.exports = {
  sequelize,
  Handle,
  Reply,
  SurgeAlertConfig,
  SurgeAlert
};
