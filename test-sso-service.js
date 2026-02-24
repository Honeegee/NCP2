const { createServerSupabase } = require('./backend/src/shared/database');
const { findOrCreateSSOUser } = require('./backend/src/modules/auth/sso.service');

async function testSSOService() {
    console.log('=== Testing SSO Service ===\n');
    
    const testProfile = {
        provider: 'linkedin',
        providerUserId: 'linkedin-test-123',
        email: 'test.link.user@example.com',
        firstName: 'Test',
        lastName: 'User',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        rawData: {
            sub: 'linkedin-test-123',
            email: 'test.link.user@example.com',
            given_name: 'Test',
            family_name: 'User',
            picture: 'https://example.com/avatar.jpg'
        }
    };

    try {
        const supabase = createServerSupabase();
        
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', testProfile.email.toLowerCase())
            .single();
            
        if (existingUser) {
            console.log('✅ User already exists. Deleting for test...');
            await supabase.from('user_sso_providers').delete().eq('user_id', existingUser.id);
            await supabase.from('nurse_profiles').delete().eq('user_id', existingUser.id);
            await supabase.from('users').delete().eq('id', existingUser.id);
        }
        
        // Test findOrCreateSSOUser
        console.log('=== Testing findOrCreateSSOUser ===');
        const result = await findOrCreateSSOUser(testProfile);
        console.log('✅ Success!');
        console.log('Result:', {
            accessToken: result.accessToken.substring(0, 50) + '...',
            refreshToken: result.refreshToken.substring(0, 50) + '...',
            isNewUser: result.isNewUser,
            user: result.user
        });
        
        // Verify created records
        console.log('\n=== Verifying created records ===');
        const { data: createdUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', testProfile.email.toLowerCase())
            .single();
        console.log('User created:', createdUser);
        
        const { data: createdProfile } = await supabase
            .from('nurse_profiles')
            .select('*')
            .eq('user_id', createdUser.id)
            .single();
        console.log('Nurse profile created:', createdProfile);
        
        const { data: ssoLink } = await supabase
            .from('user_sso_providers')
            .select('*')
            .eq('user_id', createdUser.id)
            .single();
        console.log('SSO link created:', ssoLink);
        
    } catch (error) {
        console.log('❌ Error:', error);
        console.log('Stack trace:', error.stack);
    }
}

testSSOService().catch(console.error);
