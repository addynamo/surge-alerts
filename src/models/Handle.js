const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Handle = sequelize.define('Handle', {
        handle: {
            type: DataTypes.STRING(255),
            unique: true,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.fn('NOW')
        }
    });

    Handle.associate = (models) => {
        Handle.hasMany(models.Reply);
        Handle.hasMany(models.DenyWord);
        Handle.hasMany(models.SurgeAlertConfig);
    };

    return Handle;
};
