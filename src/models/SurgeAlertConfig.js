const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SurgeAlertConfig = sequelize.define('SurgeAlertConfig', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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

    SurgeAlertConfig.associate = (models) => {
        SurgeAlertConfig.belongsTo(models.Handle);
        SurgeAlertConfig.hasMany(models.SurgeAlert, { foreignKey: 'config_id' });
    };

    return SurgeAlertConfig;
};
