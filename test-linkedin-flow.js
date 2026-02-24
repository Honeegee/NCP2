const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:4000/api/v1';
const JWT_SECRET = '8af5de8f7294539201d7e73214e68f1d61789d3a244763e28a4a5563721189e5';

async function testLinkedInFlow() {
    console.log('=== Testing LinkedIn SSO Flow ===\n');

    // 1. Generate a test JWT token (simulating LinkedIn login)
    const testUser = {
        id: 'test-linkedin-user-1',
        email: 'test.linkedin@example.com',
        role: 'nurse'
    };
    const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated test JWT token');
    console.log(testToken.substring(0, 50) + '...');

    // 2. Test /nurses/me endpoint
    console.log('\n=== Testing /nurses/me endpoint ===');
    try {
        const response = await axios.get(`${API_BASE}/nurses/me`, {
            headers: { Authorization: `Bearer ${testToken}` }
        });
        console.log('✅ Success! Status:', response.status);
        console.log('Data received:', response.data);
    } catch (error) {
        console.log('❌ Error! Status:', error.response?.status);
        console.log('Error data:', error.response?.data);
    }

    // 3. Test /auth/refresh endpoint
    console.log('\n=== Testing /auth/refresh endpoint ===');
    const refreshToken = jwt.sign({ id: testUser.id }, JWT_SECRET, { expiresIn: '7d' });
    try {
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken
        });
        console.log('✅ Success! Status:', response.status);
        console.log('Data received:', response.data);
    } catch (error) {
        console.log('❌ Error! Status:', error.response?.status);
        console.log('Error data:', error.response?.data);
    }
}

testLinkedInFlow().catch(console.error);
