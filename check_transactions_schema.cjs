const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fprtzdlaeobkuzqhdqaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log(data.length > 0 ? Object.keys(data[0]) : 'Empty table');
  }
}
run();
