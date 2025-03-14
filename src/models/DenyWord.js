const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DenyWord = sequelize.define('DenyWord', {
        word: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.fn('NOW')
        }
    });

    DenyWord.associate = (models) => {
        DenyWord.belongsTo(models.Handle);
    };

    // Add unique constraint hook for word per handle
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

    return DenyWord;
};
