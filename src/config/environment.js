const requiredEnvVars = [
    'DATABASE_URL',
    'SENDGRID_API_KEY'
];

// Verify required environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
    }
}

module.exports = {
    database: {
        url: process.env.DATABASE_URL,
        options: {
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            logging: false // Set to console.log for SQL query logging
        }
    },
    server: {
        port: process.env.PORT || 5000,
        host: '0.0.0.0'
    },
    email: {
        sendgridKey: process.env.SENDGRID_API_KEY,
        defaultFromEmail: 'reply-manager@bluerobot.com'
    },
    surgeEvaluation: {
        intervalMs: 5 * 60 * 1000, // 5 minutes
        defaultCooldownMs: 15 * 60 * 1000 // 15 minutes
    }
};
