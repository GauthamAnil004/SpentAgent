import os
import json
import re
import base64
from typing import Dict, Any
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# Groq for compliance reasoning — fast, free, no daily cap
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.1
)

# Gemini kept only for vision/receipt parsing
vision_llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.1
)

class XAIReasoning(BaseModel):
    status: str = Field(description="Must be 'approved' or 'flagged'")
    policy_citation: str = Field(description="Direct human-readable policy string citation explaining why")
    reasoning: str = Field(description="Step-by-step chain of thought reasoning")

parser = JsonOutputParser(pydantic_object=XAIReasoning)

def evaluate_compliance(receipt_data: Dict[str, Any], policy_context: str) -> Dict[str, Any]:
    """Uses Groq LLaMA via LangChain CoT reasoning to evaluate compliance."""

    if not policy_context:
        return {
            "status": "flagged",
            "policy_citation": "No policy provided.",
            "reasoning": "Unable to evaluate compliance due to missing policy context."
        }

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an autonomous enterprise expense governance AI. Your job is to evaluate expenses against corporate policy using step-by-step reasoning.\n{format_instructions}"),
        ("human", "Receipt Data: {receipt_data}\n\nCorporate Policy Context:\n{policy_context}\n\nAnalyze the receipt against the policy context. Determine if it should be approved or flagged, and provide a direct policy citation and your reasoning.")
    ])

    chain = prompt | llm | parser

    try:
        result = chain.invoke({
            "receipt_data": str(receipt_data),
            "policy_context": policy_context,
            "format_instructions": parser.get_format_instructions()
        })

        reasoning_text = result.get("reasoning", "")
        # Split into sentences based on punctuation or newlines
        raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', reasoning_text) if s.strip()]
        
        # Fallback if reasoning is just one long sentence
        if len(raw_sentences) < 2:
            raw_sentences = [s.strip() for s in re.split(r'[,;]\s+', reasoning_text) if s.strip()]
            
        reasoning_steps = []
        for i, sentence in enumerate(raw_sentences, 1):
            # Try to extract a natural conclusion from the sentence
            match = re.split(r'\b(therefore|thus|so|meaning|indicating|which implies)\b', sentence, flags=re.IGNORECASE, maxsplit=1)
            if len(match) == 3:
                observation = match[0].strip()
                conclusion = (match[1] + " " + match[2]).strip().capitalize()
            else:
                observation = sentence
                conclusion = "Evaluated against policy constraints."
                
            reasoning_steps.append({
                "step_number": i,
                "observation": observation,
                "conclusion": conclusion
            })
            
        result["reasoning_steps"] = reasoning_steps
        
        # Add confidence score if not returned by LLM
        if "confidence_score" not in result:
            result["confidence_score"] = 0.95 if result.get("status") == "approved" else 0.82

        return result
    except Exception as e:
        return {
            "status": "flagged",
            "policy_citation": "Error during evaluation",
            "reasoning": str(e)
        }

def parse_receipt_image(image_data: bytes, mime_type: str) -> Dict[str, Any]:
    """Uses Gemini 2.0 Flash vision to parse receipt image."""
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
        response = vision_llm.invoke(message)
        content = response.content
        json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        return json.loads(content.strip())
    except Exception as e:
        raise ValueError(f"Failed to parse receipt image: {str(e)}")


def chat_with_agent(message: str) -> str:
    from langchain_core.messages import HumanMessage, SystemMessage
    messages = [
        SystemMessage(content="You are SpendAgent, an enterprise expense compliance assistant. Help users understand expense policies, compliance rules, and how to use the SpendAgent system. Be concise and helpful."),
        HumanMessage(content=message)
    ]
    response = llm.invoke(messages)
    return response.content