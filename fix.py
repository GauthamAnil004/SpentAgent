lines = open('frontend/app.js', 'r', encoding='utf-8').readlines()

# Remove line 575 which adds hidden class to ledger-add
for i, line in enumerate(lines):
    if "ledger-view').classList.remove('hidden'); document.getElementById('ledger-add') && document.getElementById('ledger-add').classList.add('hidden')" in line:
        lines[i] = '\n'  # Replace with empty line

open('frontend/app.js', 'w', encoding='utf-8').writelines(lines)
print('Done')