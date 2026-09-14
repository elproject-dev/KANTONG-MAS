const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fprtzdlaeobkuzqhdqaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, owner_id, due_date, payment_status, status, cashier_name, subtotal, remaining_balance')
    .not('due_date', 'is', null)
    .neq('payment_status', 'paid');

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Outstanding Piutang count:', data.length);
    console.table(data);
  }
}
run();
