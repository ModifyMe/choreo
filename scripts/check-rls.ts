import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log('Checking ActivityLog RLS...');

    // Try to select from ActivityLog as anon
    const { data, error, count } = await supabase
        .from('ActivityLog')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error selecting from ActivityLog:', error);
    } else {
        console.log('Success! Count:', count);
    }
}

checkRLS();
