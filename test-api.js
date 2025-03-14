const axios = require('axios');
const moment = require('moment');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
    try {
        // Create a handle first
        console.log('Creating test handle...');
        const handleResponse = await axios.post(`${BASE_URL}/api/handles`, {
            handle: 'testuser'
        });
        console.log('Handle created:', handleResponse.data);

        // Create surge alert configuration
        console.log('\nCreating surge alert configuration...');
        const configData = {
            surge_reply_count_per_period: 5,
            surge_reply_period_in_ms: 300000, // 5 minutes
            alert_cooldown_period_in_ms: 900000, // 15 minutes
            emails_to_notify: ['test@example.com'],
            enabled: true
        };
        const configResponse = await axios.post(`${BASE_URL}/surge-alert/testuser/config`, configData);
        console.log('Create config response:', configResponse.data);

        // Create multiple replies that will be hidden
        console.log('\nCreating multiple replies...');
        for (let i = 0; i < 6; i++) {
            const replyResponse = await axios.post(`${BASE_URL}/api/replies`, {
                handle: 'testuser',
                replyId: `reply_${moment().unix()}_${i}`,
                content: 'Test reply content',
                isHidden: true,
                hiddenAt: moment().toISOString()
            });
            console.log(`Reply ${i + 1} created:`, replyResponse.data);
            await sleep(1000); // Space out the replies
        }

        // Wait for processing
        console.log('\nWaiting for processing...');
        await sleep(2000);

        // Check throughput metrics
        console.log('\nChecking throughput metrics...');
        const metricsResponse = await axios.get(`${BASE_URL}/surge-alert/throughput/testuser`);
        console.log('Throughput metrics:', metricsResponse.data);

        // Wait for surge evaluation
        console.log('\nWaiting for surge evaluation...');
        await sleep(5000);

        // Process notifications
        console.log('\nProcessing notifications...');
        const notifyResponse = await axios.post(`${BASE_URL}/surge-alert/notify`);
        console.log('Notification processing response:', notifyResponse.data);

    } catch (error) {
        console.error('Error during API test:', error.response?.data || error.message);
    }
}

testAPI();