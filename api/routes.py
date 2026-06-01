import os
import uuid
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from api.schemas import ReceiptUploadResponse, AuditTraceResponse
from core.agent_orchestrator import evaluate_compliance
from core.document_parser import parse_receipt_image
from db.vector_service import vector_service

router = APIRouter()

# In-memory store for audit traces (in production, use a real DB)
audit_traces = {}

@router.post("/submit-receipt", response_model=ReceiptUploadResponse)
async def submit_receipt(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    transaction_id = str(uuid.uuid4())
    
    try:
        image_data = await file.read()
        
        # 1. Parse receipt metadata using Multimodal Vision
        try:
            receipt_data = parse_receipt_image(image_data, file.content_type)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Low-quality receipt image or unparseable: {str(e)}")
            
        # 2. Retrieve policy context based on extracted data
        query = f"Expense policy for {receipt_data.get('description', '')} at {receipt_data.get('merchant', '')} for amount {receipt_data.get('amount', '')}"
        policy_chunks = vector_service.get_relevant_policy(query)
        policy_context = "\n".join(policy_chunks)
        
        if not policy_context:
            policy_context = "No specific policy context found in the vector database."
        
        # 3. Evaluate compliance using CoT
        compliance_result = evaluate_compliance(receipt_data, policy_context)
        
        # Store audit trace
        audit_traces[transaction_id] = {
            "transaction_id": transaction_id,
            "status": compliance_result.get("status", "flagged"),
            "policy_citation": compliance_result.get("policy_citation", "N/A"),
            "reasoning": compliance_result.get("reasoning", "No reasoning provided"),
            "reasoning_steps": compliance_result.get("reasoning_steps", []),
            "confidence_score": compliance_result.get("confidence_score", 1.0)
        }
        
        return ReceiptUploadResponse(
            transaction_id=transaction_id,
            status=compliance_result.get("status", "flagged"),
            extracted_data=receipt_data,
            message="Receipt processed successfully."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/upload-policy")
async def upload_policy(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF policies are supported.")
    
    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
        
    try:
        # Chunk and index PDF
        chunks_indexed = vector_service.upload_policy_pdf(tmp_path)
        return {"message": f"Policy indexed successfully. {chunks_indexed} chunks created."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index policy: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/get-xai-reasoning/{transaction_id}", response_model=AuditTraceResponse)
async def get_xai_reasoning(transaction_id: str):
    trace = audit_traces.get(transaction_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Transaction ID not found.")
    
    return AuditTraceResponse(**trace)


@router.post("/chat")
async def chat(request: dict):
    from core.agent_orchestrator import chat_with_agent
    message = request.get("message", "")
    response = chat_with_agent(message)
    return {"response": response}
