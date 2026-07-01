export const content = `
<p>Nepal's retail and restaurant landscape is booming. From the tarkari pasals of Asan to the specialty cafes of Jhamsikhel, from hardware stores in Birgunj to clothing shops in Pokhara Lakeside, business owners across the country are looking for technology to speed up transactions, reduce errors, and understand what's actually happening in their business.</p>

<p>The challenge: most POS (Point of Sale) systems they find were designed for the UK, Australia, or USA. They don't understand Nepal's business context. They show dates in AD instead of BS. They don't have eSewa or Khalti as payment options. They have no concept of udhari. They require constant internet to function. In short, they solve problems Nepal businesses don't have while ignoring problems they do.</p>

<p>This guide covers exactly what a Nepal-appropriate POS system must do — and what to look for when choosing one.</p>

<h2>Why Generic POS Systems Fail in Nepal</h2>

<p>Before understanding what a Nepal POS needs, it helps to understand why most available options fall short.</p>

<h3>Calendar mismatch</h3>
<p>Nepal officially uses Bikram Sambat (BS), which is 56-57 years ahead of the Gregorian calendar. A receipt from a Nepal business showing "June 15, 2025" is in the wrong calendar. Business records, tax filings, court documents, and all official communication in Nepal uses BS dates. A POS that only shows AD dates forces business owners to manually convert, introducing errors and creating records that don't match official documents.</p>

<h3>Payment method blindness</h3>
<p>eSewa has over 10 million users. Khalti is growing rapidly among urban youth. FonePay connects directly to bank accounts across all major Nepal banks. Mobile banking apps like IME Pay, Moru, and Hamro Pay each have their own user bases. A POS that lists only "Cash" and "Card" as payment options is disconnected from Nepal's actual payment landscape. When a customer pays via eSewa and you record it as "Cash," your accounts are wrong from the start.</p>

<h3>No credit (udhari) system</h3>
<p>Credit is fundamental to Nepal's retail economy. The chai pasal gives credit to the local rickshaw driver. The hardware store extends terms to contractors. The kirana shop runs tabs for regular families. A POS without built-in credit tracking forces business owners to maintain a separate paper khata book — which defeats the purpose of having a POS at all.</p>

<h3>Internet dependency</h3>
<p>Many areas of Nepal, including parts of Kathmandu Valley itself, experience regular internet outages. Load shedding, while much reduced from its peak, still affects connectivity in some regions. A POS that stops functioning without internet is not a reliable tool for Nepal. Business doesn't stop when the internet does.</p>

<h2>Essential Features for a Nepal POS</h2>

<h3>BS Date Display</h3>
<p>Every receipt, every report, every transaction record must show the Bikram Sambat date. Not just as an option buried in settings, but as the default. When a customer asks "when did I buy this?" they're thinking in BS. When your accountant asks for records for Baisakh 2082, they mean a specific period in BS time. Your POS should speak the same language.</p>

<h3>Nepal Payment Methods</h3>
<p>At minimum, a Nepal POS must support:</p>
<ul>
  <li>Cash (with change calculation)</li>
  <li>eSewa</li>
  <li>Khalti</li>
  <li>FonePay / bank transfer</li>
  <li>Khata (credit tab)</li>
  <li>Split payment (e.g., part cash, part eSewa)</li>
</ul>
<p>Split payment is particularly important in Nepal — customers frequently pay part of their bill digitally and the remainder in cash.</p>

<h3>Khata / Credit Tab Integration</h3>
<p>The credit system should be built into the POS, not bolted on as an afterthought. When a customer buys on khata, the transaction should automatically create a credit entry in their khata account. Their outstanding balance should be visible when you look up their profile. One tap should let you send them a WhatsApp reminder with their full transaction history.</p>

<h3>Offline Mode</h3>
<p>The POS must work fully offline — record sales, print receipts, update inventory — and sync automatically when internet is restored. Offline mode isn't a premium feature in Nepal; it's a basic requirement.</p>

<h3>VAT 13% Support</h3>
<p>For VAT-registered businesses, the POS should automatically calculate and display 13% VAT on invoices. The VAT registration number should appear on every receipt without manual input. For non-VAT-registered businesses, the VAT calculation should be optional or disabled.</p>

<h3>WhatsApp Integration</h3>
<p>Email is not how Nepal communicates. WhatsApp is. A Nepal POS should generate PDF receipts that can be shared directly to WhatsApp with one tap. When a customer wants a copy of their bill, they shouldn't wait for an email they may never open.</p>

<h3>Works on Android Phones</h3>
<p>The majority of Nepal's business owners use Android phones. Most don't use an iPad or Windows tablet for point-of-sale. A POS app that requires a specific hardware setup, a dedicated device, or an iOS tablet doesn't fit Nepal's reality. It should run smoothly on a mid-range Android phone that costs NPR 15,000-25,000.</p>

<h2>Nice-to-Have Features</h2>

<p>Beyond the essentials, these features add genuine value without being dealbreakers:</p>

<ul>
  <li><strong>Product categories and search:</strong> As inventory grows, being able to filter products by category (food, drinks, stationery) speeds up order entry.</li>
  <li><strong>Stock tracking with low-stock alerts:</strong> Know when to reorder before you run out.</li>
  <li><strong>Daily sales reports:</strong> Total revenue by payment method, shown on the home screen each morning.</li>
  <li><strong>Staff PIN login:</strong> Allow trusted employees to use the POS without giving them access to owner-level reports and settings.</li>
  <li><strong>Custom receipt header:</strong> Your business name, address, and phone number on every receipt.</li>
  <li><strong>Discount handling:</strong> Support for both percentage discounts and fixed amount discounts per transaction.</li>
</ul>

<h2>What to Avoid</h2>

<h3>Overly complex systems requiring training</h3>
<p>The best Nepal POS is one that any new staff member can learn in under 15 minutes with no technical background. If your POS requires a training manual or an onboarding session from the vendor, it will cause problems every time a new person needs to use it. Complexity is not a feature — it's a liability in a fast-paced pasal environment.</p>

<h3>USD-denominated pricing</h3>
<p>International software charging $30-50/month is unaffordable for most Nepal small businesses. At current exchange rates, that's NPR 4,000-7,000 per month — money that most pasals simply don't have for software. Look for NPR-denominated pricing, ideally with a free tier that covers basic needs.</p>

<h3>Cloud-only, no offline support</h3>
<p>If the vendor's answer to "what happens when internet is down?" is "you wait for internet," that's a dealbreaker. Your POS must work offline.</p>

<h3>No local support</h3>
<p>When something goes wrong with your POS, you need support that speaks Nepali, understands Nepal's business context, and is available during Nepal's business hours. An overseas vendor with a support ticket system that responds in 48 hours is not helpful when your POS crashes during the lunch rush.</p>

<h2>The Total Cost of a POS System</h2>

<p>When evaluating POS options, look at total cost of ownership over a year, not just the monthly subscription:</p>

<ul>
  <li>Software subscription (monthly or annual)</li>
  <li>Hardware (phone, tablet, receipt printer if needed)</li>
  <li>Training time cost</li>
  <li>Support/maintenance</li>
</ul>

<p>A free app on your existing Android phone with decent features beats a NPR 5,000/month system that requires dedicated hardware and constant training. For most Nepal small businesses, the goal is good-enough software at zero or low cost, not perfect software at high cost.</p>

<h2>Frequently Asked Questions</h2>

<h3>Q: Do I need to buy a receipt printer?</h3>
<p>A: Not necessarily. Many Nepal businesses share receipts digitally via WhatsApp instead of printing. This is cheaper (no paper, no ink, no printer maintenance) and preferred by many customers. If your business specifically needs printed receipts (e.g., a restaurant with a kitchen order printer), look for POS systems that support Bluetooth thermal printers.</p>

<h3>Q: Can one POS system work for both a shop and a restaurant?</h3>
<p>A: Most general-purpose POS systems work for both. The main difference is that restaurants often need table management and kitchen order routing — features a general pasal POS might not have. For a simple restaurant where orders are taken at the counter, a general POS works fine.</p>

<h3>Q: How does the POS handle stock for a restaurant where ingredients are used in multiple dishes?</h3>
<p>A: This requires "recipe-based" inventory tracking, where selling a dish deducts the constituent ingredients from stock. Most simple POS systems don't do this — they track dishes as products, not their ingredients. For ingredient-level tracking, you need a dedicated restaurant management system, which is generally overkill for small Nepal restaurants.</p>

<h3>Q: Is it safe to store customer credit data in an app?</h3>
<p>A: Reputable POS apps store data encrypted on secure cloud servers. This is significantly safer than a paper notebook that can be lost, stolen, or read by anyone who picks it up. Look for apps that store data in Nepal or use internationally accredited cloud providers.</p>

<h3>Q: What happens to my data if the company stops operating?</h3>
<p>A: This is a legitimate concern. Before committing to any cloud POS, check whether you can export your data (customer lists, transaction history, inventory) in a standard format like CSV. If the answer is no, your data is effectively locked in. PasalSathi allows full data export.</p>

<h3>Q: Can I use one POS for multiple shops?</h3>
<p>A: Some POS systems support multiple locations under one account. This is useful for business owners with two or more branches — you can see sales from all locations in one dashboard. Check whether multi-location support is included in the base plan or requires an upgrade.</p>

<h3>Q: Is there a POS that works in Nepali language?</h3>
<p>A: Most Nepal-built POS systems support Nepali text in customer names, product names, and messages. Full Nepali-language interfaces (all menus and buttons in Nepali) are rarer but available. For most business owners, English interface with Nepali text input is sufficient.</p>

<h3>Q: My products change frequently. How do I keep inventory updated?</h3>
<p>A: Good POS systems make product management easy — add, edit, or hide products in under 30 seconds per item. If your product catalogue changes daily (like a restaurant with daily specials), look for systems where you can quickly toggle products on or off without deleting them.</p>

<p>Nepal's small business economy is ready for better tools. The right POS doesn't need to do everything — it needs to do Nepal-specific things right. Start with one that's free, works offline, handles local payments, and tracks khata. You can always upgrade as your business grows.</p>
`
