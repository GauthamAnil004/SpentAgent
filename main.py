from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from api.routes import router
from api.personal_routes import router as personal_router
from api.auth_routes import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize Postgres tables on application startup
    init_db()
    yield

app = FastAPI(
    title="SpendAgent API",
    description="Autonomous Enterprise Expense Governance Application",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(personal_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

# Also initialize on module import for immediate availability
init_db()

@app.get("/")
def health_check():
    return {"status": "ok", "message": "SpendAgent is running"}
