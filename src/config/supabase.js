const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Warning: Supabase 환경 변수가 제대로 설정되지 않았습니다. .env 파일을 확인해 주세요.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
