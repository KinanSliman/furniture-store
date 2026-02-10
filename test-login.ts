// Test login endpoint
async function testLogin() {
  console.log('🧪 Testing login endpoint...\n');

  try {
    const response = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const setCookie = response.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookie ? '✅ Present' : '❌ Missing');
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
      if (setCookie) {
        console.log('✅ Cookie was set');
      } else {
        console.log('❌ Cookie was NOT set - this is the problem!');
      }
    } else {
      console.log('\n❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();
