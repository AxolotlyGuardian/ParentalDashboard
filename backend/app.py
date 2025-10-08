from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine, Base
from routes import auth, catalog, policy, launch, launcher

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Guardian Launcher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(policy.router)
app.include_router(launch.router)
app.include_router(launcher.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Guardian Launcher API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
