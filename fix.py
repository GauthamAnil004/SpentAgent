css = open('frontend/styles.css', 'r', encoding='utf-8').read()

mobile_css = """
@media (max-width: 600px) {
    nav {
        overflow-x: auto;
        flex-wrap: nowrap;
        justify-content: flex-start;
        padding: 8px 12px;
        gap: 8px;
    }
    .nav-btn {
        white-space: nowrap;
        font-size: 12px;
        padding: 6px 12px;
    }
    .hero-section h1 {
        font-size: 28px;
    }
    .screen {
        padding: 16px 12px;
    }
    .result-card, .form-card {
        padding: 16px;
    }
}
"""

css += mobile_css
open('frontend/styles.css', 'w', encoding='utf-8').write(css)
print('Done')