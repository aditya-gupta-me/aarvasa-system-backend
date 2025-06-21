from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.chatbot import get_chat_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    message: str
    history: list[tuple[str, str]] = []

@app.post("/chat")
async def chat(message: Message):
    reply = get_chat_response(message.message, message.history)
    return {"response": reply}
