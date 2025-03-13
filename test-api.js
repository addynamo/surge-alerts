const fetch = require('node-fetch');

async function testAPI() {
    try {
        // Test storing a reply
        console.log('Testing reply storage...');
        const replyResponse = await fetch('http://localhost:5000/api/replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                handle: 'testuser',
                reply_id: 'reply123',
                content: 'This is a test reply with some bad content'
            })
        });
        console.log('Store reply response:', await replyResponse.json());

        // Test adding a denyword
        console.log('\nTesting denyword addition...');
        const denywordResponse = await fetch('http://localhost:5000/api/denywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                handle: 'testuser',
                word: 'bad'
            })
        });
        console.log('Add denyword response:', await denywordResponse.json());

        // Test getting hidden replies
        console.log('\nTesting hidden replies retrieval...');
        const hiddenResponse = await fetch('http://localhost:5000/api/hidden-replies/testuser');
        console.log('Hidden replies response:', await hiddenResponse.json());

    } catch (error) {
        console.error('Error during API test:', error);
    }
}

testAPI();
