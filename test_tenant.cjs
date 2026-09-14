const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY');

async function run() {
  const { data: txs } = await supabase
    .from('transactions')
    .select('owner_id')
    .not('due_date', 'is', null)
    .neq('payment_status', 'paid');
    
  const tenants = [...new Set(txs.map(t => t.owner_id))];
  console.log("Tenants with pending piutang:", tenants);
  
  for (const t of tenants) {
    let q2 = supabase
      .from('transactions')
      .select(`*, customer:customers(id, name, phone), transaction_items(*)`)
      .not('due_date', 'is', null)
      .eq('owner_id', t);
    const { data: d2, error } = await q2;
    console.log(`Tenant ${t} has ${d2?.length} rows in useListReceivables. Error: ${error}`);
  }
}
run();
