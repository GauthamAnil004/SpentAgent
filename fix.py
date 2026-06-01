import re

# Fix index.html - set correct default active tabs
html = open('frontend/index.html', 'r', encoding='utf-8').read()

# Make View Records the default active tab button
html = re.sub(
    r'(switchTab\(\'ledger-add\'[^)]*\)[^>]*>)[^<]*(Add Entry)',
    lambda m: m.group(0).replace('class="tab-btn active"', 'class="tab-btn"').replace('class="tab-btn active "', 'class="tab-btn"'),
    html
)

open('frontend/index.html', 'w', encoding='utf-8').write(html)

# Fix app.js - remove all the broken ledger navigate code and replace cleanly
js = open('frontend/app.js', 'r', encoding='utf-8').read()

# Find the navigate function and add a simple ledger handler at the end of the file
if 'function showLedgerRecords()' not in js:
    js += """

function showLedgerRecords() {
    var addTab = document.getElementById('ledger-add');
    var viewTab = document.getElementById('ledger-view');
    var btns = document.querySelectorAll('#screen-ledger .tab-btn');
    btns.forEach(function(b){ b.classList.remove('active'); });
    var viewBtn = document.querySelector('#screen-ledger .tab-btn:last-child');
    if(viewBtn) viewBtn.classList.add('active');
    if(addTab){ addTab.classList.add('hidden'); addTab.classList.remove('active'); }
    if(viewTab){ viewTab.classList.remove('hidden'); viewTab.classList.add('active'); }
    loadLedgerRecords();
}
"""

open('frontend/app.js', 'w', encoding='utf-8').write(js)
print('Done')