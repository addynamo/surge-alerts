const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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

    Reply.associate = (models) => {
        Reply.belongsTo(models.Handle);
    };

    return Reply;
};
