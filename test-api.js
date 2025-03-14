const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5001'; // Match server port

async function testAPI() {
    try {
        // Test storing a reply
        console.log('Testing reply storage...');
        const replyResponse = await axios.post(`${BASE_URL}/api/replies`, {
            handle: 'testuser',
            reply_id: 'reply123',
            content: 'This is a test reply with some bad content'
        });
        console.log('Store reply response:', replyResponse.data);

        // Test adding a denyword
        console.log('\nTesting denyword addition...');
        const denywordResponse = await axios.post(`${BASE_URL}/api/denywords`, {
            handle: 'testuser',
            word: 'bad'
        });
        console.log('Add denyword response:', denywordResponse.data);

        // Test getting hidden replies
        console.log('\nTesting hidden replies retrieval...');
        const hiddenResponse = await axios.get(`${BASE_URL}/api/hidden-replies/testuser`);
        console.log('Hidden replies response:', hiddenResponse.data);

    } catch (error) {
        console.error('Error during API test:', error.response?.data || error.message);
    }
}

testAPI();