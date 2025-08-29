from fastapi import FastAPI

app = FastAPI(title="Personal Finance Assistant API")

@app.get("/")
def root():
    return {"message": "Backend is running!"}
