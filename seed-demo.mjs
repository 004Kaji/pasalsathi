import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ibspeqkqksvlwsurbxsd.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3BlcWtxa3N2bHdzdXJieHNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjUzNzE0MCwiZXhwIjoyMDk4MTEzMTQwfQ.XUuZOi1e0rt4T1mLz13uC4b_dX-2daQbJXb2g9Jac1s'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Asar 2083 BS → AD range: ~2026-06-15 to 2026-07-15
const DATES = [
  '2026-06-15','2026-06-16','2026-06-18','2026-06-20',
  '2026-06-22','2026-06-23','2026-06-25','2026-06-27',
  '2026-06-28','2026-06-30','2026-07-01','2026-07-03',
  '2026-07-05','2026-07-07','2026-07-10','2026-07-12',
]

async function main() {
  // ── 1. Find or create business ──
  const { data: bizList } = await supabase.from('businesses').select('*').limit(1)
  if (!bizList?.length) {
    console.error('❌ No business found. Please sign up and create a business first.')
    process.exit(1)
  }
  const biz = bizList[0]
  const BIZ = biz.id
  console.log(`✅ Business: "${biz.name}" (${BIZ})`)

  // ── 2. Products ──
  const { data: existingProducts } = await supabase.from('products').select('id,name,current_stock').eq('business_id', BIZ)
  let products = existingProducts ?? []

  if (products.length === 0) {
    console.log('📦 Inserting demo products...')
    const { data: newProds } = await supabase.from('products').insert([
      { business_id: BIZ, name: 'Basmati Rice', unit: 'kg',    buying_price: 85,  selling_price: 100, current_stock: 200, is_active: true },
      { business_id: BIZ, name: 'Mustard Oil',  unit: 'litre', buying_price: 160, selling_price: 190, current_stock: 50,  is_active: true },
      { business_id: BIZ, name: 'Sugar',        unit: 'kg',    buying_price: 70,  selling_price: 82,  current_stock: 100, is_active: true },
      { business_id: BIZ, name: 'Lentils',      unit: 'kg',    buying_price: 110, selling_price: 130, current_stock: 80,  is_active: true },
      { business_id: BIZ, name: 'Flour (Atta)', unit: 'kg',    buying_price: 55,  selling_price: 65,  current_stock: 150, is_active: true },
    ]).select()
    products = newProds ?? []
    console.log(`   ✓ ${products.length} products added`)
  } else {
    console.log(`📦 Using existing ${products.length} products`)
  }

  // ── 3. Staff ──
  const { data: existingStaff } = await supabase.from('staff').select('id,name').eq('business_id', BIZ)
  let staff = existingStaff ?? []

  if (staff.length === 0) {
    console.log('👥 Inserting demo staff...')
    const { data: newStaff } = await supabase.from('staff').insert([
      { business_id: BIZ, name: 'Ram Bahadur', role: 'Sales Staff', monthly_salary: 18000, is_active: true, join_date: '2025-01-15' },
      { business_id: BIZ, name: 'Sita Kumari', role: 'Cashier',     monthly_salary: 15000, is_active: true, join_date: '2025-03-01' },
    ]).select()
    staff = newStaff ?? []
    console.log(`   ✓ ${staff.length} staff added`)
  } else {
    console.log(`👥 Using existing ${staff.length} staff`)
  }

  // ── 4. Customers (Khata) ──
  const { data: existingCust } = await supabase.from('customers').select('id,name').eq('business_id', BIZ)
  let customers = existingCust ?? []

  if (customers.length === 0) {
    console.log('👤 Inserting demo customers...')
    const { data: newCust } = await supabase.from('customers').insert([
      { business_id: BIZ, name: 'Hari Prasad Sharma',  phone: '9841000001', address: 'Kathmandu', total_credit: 0, total_paid: 0 },
      { business_id: BIZ, name: 'Sunita Thapa',        phone: '9851000002', address: 'Lalitpur',  total_credit: 0, total_paid: 0 },
      { business_id: BIZ, name: 'Bikash Store',        phone: '9861000003', address: 'Bhaktapur', total_credit: 0, total_paid: 0 },
    ]).select()
    customers = newCust ?? []
    console.log(`   ✓ ${customers.length} customers added`)
  } else {
    console.log(`👤 Using existing ${customers.length} customers`)
  }

  // ── 5. Suppliers ──
  const { data: existingSupp } = await supabase.from('suppliers').select('id,name').eq('business_id', BIZ)
  let suppliers = existingSupp ?? []

  if (suppliers.length === 0) {
    console.log('🚛 Inserting demo suppliers...')
    const { data: newSupp } = await supabase.from('suppliers').insert([
      { business_id: BIZ, name: 'Nepal Agro Wholesale', phone: '9801000010', address: 'Asan, Kathmandu', total_credit_taken: 0, total_paid: 0, is_active: true },
      { business_id: BIZ, name: 'Himalayan Traders',    phone: '9801000011', address: 'New Road, KTM',   total_credit_taken: 0, total_paid: 0, is_active: true },
    ]).select()
    suppliers = newSupp ?? []
    console.log(`   ✓ ${suppliers.length} suppliers added`)
  } else {
    console.log(`🚛 Using existing ${suppliers.length} suppliers`)
  }

  // ── 6. Check if demo transactions already exist ──
  const { data: existingTx, count: txCount } = await supabase
    .from('transactions').select('id', { count: 'exact' })
    .eq('business_id', BIZ)
    .gte('transaction_date', '2026-06-15')

  if ((txCount ?? 0) > 5) {
    console.log(`\n⚠️  Already have ${txCount} transactions for Asar 2083. Skipping seed.`)
    await printSummary(BIZ)
    return
  }

  // ── 7. Sales transactions (income) ──
  console.log('\n💰 Adding sales transactions...')
  const salesData = [
    { date: '2026-06-15', amount: 4500,  desc: 'Rice & lentils sale — Hari Prasad' },
    { date: '2026-06-16', amount: 2800,  desc: 'Mustard oil & flour — walk-in customer' },
    { date: '2026-06-18', amount: 6200,  desc: 'Bulk rice sale — Bikash Store' },
    { date: '2026-06-20', amount: 3100,  desc: 'Mixed grocery — Sunita Thapa' },
    { date: '2026-06-22', amount: 5400,  desc: 'Sugar & flour — daily sales' },
    { date: '2026-06-23', amount: 1900,  desc: 'Lentils — walk-in customer' },
    { date: '2026-06-25', amount: 7800,  desc: 'Wholesale rice — Bikash Store' },
    { date: '2026-06-27', amount: 3200,  desc: 'Oil & sugar — daily sales' },
    { date: '2026-06-28', amount: 4100,  desc: 'Mixed sale — Hari Prasad' },
    { date: '2026-06-30', amount: 5600,  desc: 'End of month bulk sale' },
    { date: '2026-07-01', amount: 2900,  desc: 'Rice & flour — new month opening' },
    { date: '2026-07-03', amount: 4700,  desc: 'Oil & lentils — regular customers' },
    { date: '2026-07-05', amount: 3800,  desc: 'Mixed grocery — daily sales' },
    { date: '2026-07-07', amount: 6100,  desc: 'Sunita Thapa — bulk order' },
    { date: '2026-07-10', amount: 4300,  desc: 'Sugar & rice — morning sales' },
    { date: '2026-07-12', amount: 5200,  desc: 'Wholesale — Bikash Store' },
  ]

  const { error: salesErr } = await supabase.from('transactions').insert(
    salesData.map(s => ({
      business_id: BIZ, type: 'in', amount: s.amount,
      category: 'sales', description: s.desc, payment_method: 'cash',
      transaction_date: s.date, created_by: null,
    }))
  )
  if (salesErr) console.error('Sales error:', salesErr.message)
  else console.log(`   ✓ ${salesData.length} sales added — Total: NPR ${salesData.reduce((s,x)=>s+x.amount,0).toLocaleString()}`)

  // ── 8. Purchase / COGS transactions ──
  console.log('🛒 Adding purchase transactions...')
  const purchaseData = [
    { date: '2026-06-15', amount: 17000, desc: 'Rice restock — Nepal Agro Wholesale (200kg)' },
    { date: '2026-06-20', amount: 8000,  desc: 'Mustard oil restock — Himalayan Traders (50L)' },
    { date: '2026-06-25', amount: 7000,  desc: 'Sugar & lentils — Nepal Agro (100kg)' },
    { date: '2026-07-02', amount: 8250,  desc: 'Flour restock — Himalayan Traders (150kg)' },
    { date: '2026-07-08', amount: 6500,  desc: 'Lentils restock — Nepal Agro (60kg)' },
  ]

  const { error: purchErr } = await supabase.from('transactions').insert(
    purchaseData.map(p => ({
      business_id: BIZ, type: 'out', amount: p.amount,
      category: 'purchase', description: p.desc, payment_method: 'cash',
      transaction_date: p.date, created_by: null,
    }))
  )
  if (purchErr) console.error('Purchase error:', purchErr.message)
  else console.log(`   ✓ ${purchaseData.length} purchases added — Total: NPR ${purchaseData.reduce((s,x)=>s+x.amount,0).toLocaleString()}`)

  // ── 9. Operating expenses ──
  console.log('💸 Adding expense transactions...')
  const expenseData = [
    { date: '2026-06-15', amount: 5500,  desc: 'Shop rent — Asar 2083' },
    { date: '2026-06-16', amount: 1200,  desc: 'Electricity bill — NEA' },
    { date: '2026-06-20', amount: 800,   desc: 'Packaging materials' },
    { date: '2026-06-28', amount: 1500,  desc: 'Delivery charges' },
    { date: '2026-07-05', amount: 600,   desc: 'Stationery & misc' },
    { date: '2026-07-10', amount: 2000,  desc: 'Internet & phone bill' },
  ]

  const { error: expErr } = await supabase.from('transactions').insert(
    expenseData.map(e => ({
      business_id: BIZ, type: 'out', amount: e.amount,
      category: 'expense', description: e.desc, payment_method: 'cash',
      transaction_date: e.date, created_by: null,
    }))
  )
  if (expErr) console.error('Expense error:', expErr.message)
  else console.log(`   ✓ ${expenseData.length} expenses added — Total: NPR ${expenseData.reduce((s,x)=>s+x.amount,0).toLocaleString()}`)

  // ── 10. Salary payments ──
  if (staff.length > 0) {
    console.log('👤 Adding salary payments...')
    const salaryRows = staff.map(s => ({
      business_id: BIZ, type: 'out', amount: s.monthly_salary ?? 15000,
      category: 'salary',
      description: `Salary — ${s.name} — Asar 2083`,
      payment_method: 'cash', transaction_date: '2026-06-30', created_by: null,
    }))
    const { error: salErr } = await supabase.from('transactions').insert(salaryRows)
    if (salErr) console.error('Salary error:', salErr.message)
    else console.log(`   ✓ ${salaryRows.length} salary transactions`)
  }

  // ── 11. Khata entries (credit sales) ──
  if (customers.length > 0) {
    console.log('📒 Adding khata (credit) entries...')
    const khataRows = [
      { customer_id: customers[0].id, type: 'credit',  amount: 3500, date: '2026-06-18', desc: 'Rice & lentils on credit' },
      { customer_id: customers[0].id, type: 'payment', amount: 2000, date: '2026-06-25', desc: 'Partial payment' },
      { customer_id: customers[1].id, type: 'credit',  amount: 2800, date: '2026-06-20', desc: 'Oil & flour on credit' },
      { customer_id: customers[2].id, type: 'credit',  amount: 6200, date: '2026-06-22', desc: 'Bulk order on credit' },
      { customer_id: customers[2].id, type: 'payment', amount: 4000, date: '2026-07-05', desc: 'Partial settlement' },
    ]
    for (const k of khataRows) {
      await supabase.from('khata_entries').insert({
        business_id: BIZ, customer_id: k.customer_id, type: k.type,
        amount: k.amount, description: k.desc, entry_date: k.date, created_by: null,
      })
      const field = k.type === 'credit' ? 'total_credit' : 'total_paid'
      const { data: cust } = await supabase.from('customers').select(field).eq('id', k.customer_id).single()
      await supabase.from('customers').update({
        [field]: (Number(cust?.[field] ?? 0)) + k.amount
      }).eq('id', k.customer_id)
    }
    console.log(`   ✓ ${khataRows.length} khata entries`)
  }

  // ── 12. Supplier entries ──
  if (suppliers.length > 0) {
    console.log('🚛 Adding supplier entries...')
    const suppEntries = [
      { sup: suppliers[0].id, type: 'credit_taken', amount: 17000, date: '2026-06-15', desc: 'Rice 200kg on credit' },
      { sup: suppliers[0].id, type: 'payment_made', amount: 10000, date: '2026-06-28', desc: 'Partial payment' },
      { sup: suppliers[1].id, type: 'credit_taken', amount: 8000,  date: '2026-06-20', desc: 'Mustard oil on credit' },
    ]
    for (const se of suppEntries) {
      await supabase.from('supplier_entries').insert({
        business_id: BIZ, supplier_id: se.sup, type: se.type,
        amount: se.amount, description: se.desc, entry_date: se.date,
        bs_date: '14 असार 2083', created_by: null,
      })
      const field = se.type === 'credit_taken' ? 'total_credit_taken' : 'total_paid'
      const { data: sup } = await supabase.from('suppliers').select(field).eq('id', se.sup).single()
      await supabase.from('suppliers').update({
        [field]: (Number(sup?.[field] ?? 0)) + se.amount
      }).eq('id', se.sup)
    }
    console.log(`   ✓ ${suppEntries.length} supplier entries`)
  }

  await printSummary(BIZ)
}

async function printSummary(bizId) {
  const { data: txs } = await supabase.from('transactions')
    .select('type, amount, category')
    .eq('business_id', bizId)
    .gte('transaction_date', '2026-06-15')
    .lte('transaction_date', '2026-07-15')

  const sales    = txs?.filter(t => t.type === 'in'  && t.category === 'sales')   .reduce((s,t)=>s+Number(t.amount),0) ?? 0
  const purchase = txs?.filter(t => t.type === 'out' && t.category === 'purchase').reduce((s,t)=>s+Number(t.amount),0) ?? 0
  const expense  = txs?.filter(t => t.type === 'out' && t.category === 'expense') .reduce((s,t)=>s+Number(t.amount),0) ?? 0
  const salary   = txs?.filter(t => t.type === 'out' && t.category === 'salary')  .reduce((s,t)=>s+Number(t.amount),0) ?? 0

  const gross  = sales - purchase
  const net    = gross - expense - salary

  console.log('\n' + '═'.repeat(45))
  console.log('📊 PasalSathi — Asar 2083 BS Report Preview')
  console.log('═'.repeat(45))
  console.log(`💰 Sales Revenue       NPR ${sales.toLocaleString().padStart(10)}`)
  console.log(`🛒 COGS (Purchase)    -NPR ${purchase.toLocaleString().padStart(10)}`)
  console.log(`   ─────────────────────────────────────────`)
  console.log(`📈 Gross Profit        NPR ${gross.toLocaleString().padStart(10)}  (${Math.round(gross/sales*100)}% margin)`)
  console.log(`💸 Operating Expenses -NPR ${expense.toLocaleString().padStart(10)}`)
  console.log(`👤 Staff Salaries     -NPR ${salary.toLocaleString().padStart(10)}`)
  console.log(`   ─────────────────────────────────────────`)
  console.log(`🟢 Net Profit          NPR ${net.toLocaleString().padStart(10)}  (${Math.round(net/sales*100)}% margin)`)
  console.log('═'.repeat(45))
  console.log('\n✅ Done! Refresh pasalsathi.net/report to see the numbers.\n')
}

main().catch(console.error)
