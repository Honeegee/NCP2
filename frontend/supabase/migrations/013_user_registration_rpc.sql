-- Create an RPC to atomically register a nurse user and create their empty profile
CREATE OR REPLACE FUNCTION register_nurse(
    email_param TEXT,
    password_hash_param TEXT
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Insert into users table
    INSERT INTO users (email, password_hash, role, email_verified)
    VALUES (email_param, password_hash_param, 'nurse', false)
    RETURNING id INTO new_user_id;

    -- Insert into nurse_profiles table using the newly created user_id
    INSERT INTO nurse_profiles (
        user_id, 
        first_name, 
        last_name, 
        phone, 
        country, 
        years_of_experience, 
        profile_complete
    ) VALUES (
        new_user_id, 
        '', 
        '', 
        '', 
        'Philippines', 
        0, 
        false
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
