import base64
import json
import re
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1
)

def parse_receipt_image(image_data: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Uses Gemini 2.0 Flash multimodal vision to parse metadata from a receipt image.
    Extracts: merchant, date, amount (float), and description.
    """
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    message = [
        (
            "system",
            "Extract the following metadata from the receipt: merchant (string), date (string), amount (float), and description (string). Return only a valid JSON object without any additional text."
        ),
        (
            "human",
            [
                {"type": "text", "text": "Parse this receipt."},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_base64}"}}
            ]
        )
    ]
    
    try:
        response = llm.invoke(message)
        content = response.content
        
        # Strip markdown json blocks if present
        json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
            
        return json.loads(content.strip())
    except Exception as e:
        raise ValueError(f"Failed to parse receipt image: {str(e)}")
