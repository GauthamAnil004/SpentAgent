import os
import requests
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw

def generate_pdf():
    pdf_path = "corporate_policy.pdf"
    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.drawString(100, 750, "SPENDAGENT CORPORATE EXPENSE POLICY")
    c.drawString(100, 720, "1. Meal Expenses:")
    c.drawString(120, 700, "- Individual meal expenses are capped at $50.00 per transaction.")
    c.drawString(120, 680, "- Alcohol purchases are strictly prohibited and non-reimbursable.")
    c.drawString(100, 650, "2. Travel Expenses:")
    c.drawString(120, 630, "- Domestic flights must be economy class.")
    c.drawString(120, 610, "- Hotel lodging is capped at $200.00 per night.")
    c.drawString(100, 580, "3. Software and Tech Expenses:")
    c.drawString(120, 560, "- Any software subscription under $100.00/month is pre-approved.")
    c.drawString(120, 540, "- Subscriptions above $100.00/month require manager sign-off.")
    c.save()
    print("Generated corporate_policy.pdf")

def generate_receipt_image():
    image_path = "receipt.png"
    img = Image.new("RGB", (400, 500), color="white")
    draw = ImageDraw.Draw(img)
    
    draw.text((20, 20), "STARBUCKS #10243", fill="black")
    draw.text((20, 40), "Seattle, WA", fill="black")
    draw.text((20, 80), "DATE: 2026-05-30", fill="black")
    draw.text((20, 100), "ITEMS:", fill="black")
    draw.text((40, 120), "1x Cafe Latte        $4.50", fill="black")
    draw.text((40, 140), "1x Butter Croissant   $3.50", fill="black")
    draw.text((40, 160), "1x Breakfast Panini   $4.50", fill="black")
    draw.text((20, 200), "TOTAL AMOUNT: 12.50", fill="black")
    draw.text((20, 240), "PAID WITH VISA *4321", fill="black")
    draw.text((20, 280), "THANK YOU!", fill="black")
    
    img.save(image_path)
    print("Generated receipt.png")

def run_tests():
    base_url = "http://127.0.0.1:8000/api"
    
    # Test 1: Upload Policy
    print("\n--- Test 1: Uploading Corporate Policy PDF ---")
    with open("corporate_policy.pdf", "rb") as f:
        files = {"file": ("corporate_policy.pdf", f, "application/pdf")}
        r = requests.post(f"{base_url}/upload-policy", files=files)
        print("Status Code:", r.status_code)
        print("Response:", r.json())
        
    # Test 2: Submit Receipt (Meal under $50 - Approved)
    print("\n--- Test 2: Submitting Starbucks Receipt ($12.50) ---")
    with open("receipt.png", "rb") as f:
        files = {"file": ("receipt.png", f, "image/png")}
        r = requests.post(f"{base_url}/submit-receipt", files=files)
        print("Status Code:", r.status_code)
        resp_data = r.json()
        print("Response:", resp_data)
        transaction_id = resp_data.get("transaction_id")
        
    # Test 3: Get Audit Trace / XAI Reasoning
    if transaction_id:
        print(f"\n--- Test 3: Fetching XAI Reasoning for Transaction: {transaction_id} ---")
        r = requests.get(f"{base_url}/get-xai-reasoning/{transaction_id}")
        print("Status Code:", r.status_code)
        import json
        print("Reasoning Response:\n", json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    generate_pdf()
    generate_receipt_image()
    run_tests()
