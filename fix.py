css = open('frontend/styles.css', 'r', encoding='utf-8').read()

extra_css = """
select option {
    background-color: #1a2035;
    color: #ffffff;
}

select {
    background-color: #1a2035;
    color: #ffffff;
}
"""

css += extra_css
open('frontend/styles.css', 'w', encoding='utf-8').write(css)
print('Done')