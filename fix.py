lines = open('frontend/app.js', 'r', encoding='utf-8').readlines()

for i, line in enumerate(lines):
    if "addTab.classList.remove('active');addTab.classList.add('hidden');" in line:
        lines[i] = "    if(addTab){addTab.classList.remove('hidden');addTab.classList.add('active');}\n"
    if "viewTab.classList.remove('hidden');viewTab.classList.add('active');" in line:
        lines[i] = "    if(viewTab){viewTab.classList.add('hidden');viewTab.classList.remove('active');}\n"

open('frontend/app.js', 'w', encoding='utf-8').writelines(lines)
print('Done')