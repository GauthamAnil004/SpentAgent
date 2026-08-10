from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="SpendAgent API",
    description="Autonomous Enterprise Expense Governance Application",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

from db.database import init_db
from api.personal_routes import router as personal_router
from api.auth_routes import router as auth_router

init_db()
app.include_router(personal_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "SpendAgent is running"}
