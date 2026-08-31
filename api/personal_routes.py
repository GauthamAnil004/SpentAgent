from fastapi import APIRouter, Depends, HTTPException
from db.database import get_connection
from core.agent_orchestrator import llm
from langchain_core.messages import HumanMessage, SystemMessage
from api.auth_routes import get_current_user_id

router = APIRouter()

# ─── Personal Finance Tracker ───────────────────────────────────

@router.post("/personal/add-expense")
async def add_expense(data: dict, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO personal_expenses (user_id, amount, category, description, date)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (user_id, data["amount"], data["category"], data.get("description", ""), data["date"]))
    inserted = cursor.fetchone()
    expense_id = inserted["id"] if inserted else None
    conn.commit()
    cursor.close()
    conn.close()
    return {"id": expense_id, "message": "Expense added successfully."}

@router.get("/personal/expenses")
async def get_expenses(user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM personal_expenses WHERE user_id = %s ORDER BY date DESC", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"expenses": [dict(row) for row in rows]}

@router.delete("/personal/expense/{expense_id}")
async def delete_expense(expense_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM personal_expenses WHERE id = %s AND user_id = %s RETURNING id", (expense_id, user_id))
    deleted = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found or unauthorized")
    return {"message": "Expense deleted."}

@router.get("/personal/analyze")
async def analyze_expenses(user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM personal_expenses WHERE user_id = %s ORDER BY date DESC", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return {"analysis": "No expenses recorded yet. Start adding your expenses to get AI-powered insights!"}

    expenses_text = "\n".join([
        f"- {dict(row)['date']}: {dict(row)['category']} - ${dict(row)['amount']} ({dict(row)['description']})"
        for row in rows
    ])

    messages = [
        SystemMessage(content="You are a personal finance advisor. Analyze the user's spending and give 3-4 specific, actionable suggestions to improve their financial habits. Be concise and friendly."),
        HumanMessage(content=f"Here are my recent expenses:\n{expenses_text}\n\nGive me specific suggestions to improve my spending.")
    ]
    response = llm.invoke(messages)
    return {"analysis": response.content}

# ─── Friend Ledger ─────────────────────────────────────────────

@router.post("/ledger/add")
async def add_ledger_entry(data: dict, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO friend_ledger (user_id, friend_name, amount, type, description, date, expected_return_date, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        user_id,
        data["friend_name"],
        data["amount"],
        data["type"],
        data.get("description", ""),
        data["date"],
        data.get("expected_return_date", ""),
        "pending"
    ))
    inserted = cursor.fetchone()
    entry_id = inserted["id"] if inserted else None
    conn.commit()
    cursor.close()
    conn.close()
    return {"id": entry_id, "message": "Ledger entry added successfully."}

@router.get("/ledger/records")
async def get_ledger_records(user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM friend_ledger WHERE user_id = %s ORDER BY date DESC", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"records": [dict(row) for row in rows]}

@router.patch("/ledger/settle/{entry_id}")
async def settle_entry(entry_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE friend_ledger SET status = 'settled' WHERE id = %s AND user_id = %s RETURNING id", (entry_id, user_id))
    settled = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if not settled:
        raise HTTPException(status_code=404, detail="Ledger entry not found or unauthorized")
    return {"message": "Entry marked as settled."}

@router.delete("/ledger/delete/{entry_id}")
async def delete_entry(entry_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM friend_ledger WHERE id = %s AND user_id = %s RETURNING id", (entry_id, user_id))
    deleted = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Ledger entry not found or unauthorized")
    return {"message": "Entry deleted."}
