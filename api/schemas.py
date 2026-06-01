from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

class ComplianceVerdict(str, Enum):
    APPROVED = "approved"
    FLAGGED = "flagged"

class ExpenseCategory(str, Enum):
    TRAVEL = "travel"
    MEALS = "meals"
    SOFTWARE = "software"
    OFFICE_SUPPLIES = "office_supplies"
    OTHER = "other"

class ParsedReceiptData(BaseModel):
    merchant: str
    amount: float
    date: str
    description: str
    category: Optional[ExpenseCategory] = None

class ReceiptUploadResponse(BaseModel):
    transaction_id: str
    status: str
    extracted_data: Optional[ParsedReceiptData]
    message: str

class ComplianceRequest(BaseModel):
    transaction_id: str
    merchant: str
    amount: float
    date: str
    description: str

class ReasoningStep(BaseModel):
    step_number: int
    observation: str
    conclusion: str

class AuditTraceResponse(BaseModel):
    transaction_id: str
    status: ComplianceVerdict
    policy_citation: str
    reasoning: str
    reasoning_steps: List[ReasoningStep]
    confidence_score: float
