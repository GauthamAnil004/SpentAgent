lines = open('frontend/index.html', 'r', encoding='utf-8').readlines()

for i, line in enumerate(lines):
    if 'ledger-add' in line and 'tab-btn' in line:
        lines[i] = line.replace('class="tab-btn"', 'class="tab-btn active"')
    if 'ledger-view' in line and 'tab-btn active' in line:
        lines[i] = line.replace('class="tab-btn active"', 'class="tab-btn"')
    if 'id="ledger-add"' in line and 'hidden' in line:
        lines[i] = line.replace('hidden', 'active')
    if 'id="ledger-view"' in line and 'active' in line:
        lines[i] = line.replace('active', 'hidden')

open('frontend/index.html', 'w', encoding='utf-8').writelines(lines)
print('Done')