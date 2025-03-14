const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/environment');
const { logger } = require('../config/logger');

const sequelize = new Sequelize(config.database.url, config.database.options);

const db = {};

// Read all model files in the current directory
fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== 'index.js' &&
            file.slice(-3) === '.js'
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, DataTypes);
        db[model.name] = model;
    });

// Call associate if it exists
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Define relationships (moved from original file)
db.Handle.hasMany(db.Reply);
db.Reply.belongsTo(db.Handle);

db.Handle.hasMany(db.SurgeAlertConfig);
db.SurgeAlertConfig.belongsTo(db.Handle);

db.SurgeAlertConfig.hasMany(db.SurgeAlert, { foreignKey: 'config_id' });
db.SurgeAlert.belongsTo(db.SurgeAlertConfig, { foreignKey: 'config_id' });


db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test database connection
sequelize.authenticate()
    .then(() => {
        logger.info('Database connection established successfully');
    })
    .catch(err => {
        logger.error('Unable to connect to the database:', err);
    });

module.exports = db;