const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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

    SurgeAlert.associate = (models) => {
        SurgeAlert.belongsTo(models.SurgeAlertConfig, { foreignKey: 'config_id' });
    };

    return SurgeAlert;
};
