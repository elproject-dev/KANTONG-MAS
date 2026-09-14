const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY');

async function run() {
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, status, owner_id')
    .not('due_date', 'is', null)
    .neq('payment_status', 'paid');
    
  console.log("Transactions with due_date not null and unpaid:");
  const nonCompleted = txs.filter(t => t.status !== 'completed');
  console.log(nonCompleted);
}
run();
