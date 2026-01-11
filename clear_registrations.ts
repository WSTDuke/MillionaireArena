import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearRegistrations() {
  console.log('Clearing registrations for tournament: community-weekly-cup-42...');
  const { data, error } = await supabase
    .from('tournament_registrations')
    .delete()
    .eq('tournament_id', 'community-weekly-cup-42');

  if (error) {
    console.error('Error clearing registrations:', error);
  } else {
    console.log('Successfully cleared registrations.');
  }
}

clearRegistrations();
