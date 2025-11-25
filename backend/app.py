from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine, Base
from routes import auth, catalog, policy, launch, launcher, content_tags, admin, services

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Guardian Launcher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(policy.router, prefix="/api")
app.include_router(launch.router, prefix="/api")
app.include_router(launcher.router, prefix="/api")
app.include_router(content_tags.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(services.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Guardian Launcher API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
