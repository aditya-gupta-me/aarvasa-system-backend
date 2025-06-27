import openai
from app.rag_engine import CompanyRAG, NavigationRAG

MODEL = "llama3-8b-8192"
MAX_CONTEXT_MESSAGES = 15

system_instructions = (
    "You are Aarvasa's friendly AI assistant helping users with anything related to real estate. "
    "Start by answering naturally in a helpful and friendly tone. "
    "Always try to find answers from the company context file first. "
    "If not found and if the question is about where to find something on the site, check the navigation.json file. "
    "If neither helps, still try to give your best answer in a clear, short, and persuasive way. "
    "If users ask to 'show properties under a price' (e.g., under 30 lakhs), inform them to visit the Listings or Search page. "
    "Avoid going off-topic and keep your response brief (within 3 lines unless really needed). "
    "If you don't know, be honest and say you don't know."
)

class MCPOrchestrator:
    def __init__(self, company_rag: CompanyRAG, nav_rag: NavigationRAG):
        self.company_rag = company_rag
        self.nav_rag = nav_rag

    def route(self, user_message: str, history=None):
        msg_lower = user_message.lower()

        # Prioritize navigation queries
        if any(keyword in msg_lower for keyword in ["go to", "navigate", "page", "link", "forgot", "sign in", "sign up"]):
            nav_response = self._handle_navigation(user_message)
            if nav_response:
                return nav_response

        # Check company-related context
        if any(keyword in msg_lower for keyword in ["aarvasa", "founder", "services", "real estate", "startup", "vision", "mission", "blockchain", "ar/vr"]):
            company_response = self._handle_company_info(user_message, history)
            if company_response:
                return company_response

        # Default: Try both
        nav_response = self._handle_navigation(user_message)
        if nav_response:
            return nav_response

        company_response = self._handle_company_info(user_message, history)
        if company_response:
            return company_response

        return "Hey! I'm Aarvasa's assistant. Let me know how I can help with your property queries. 😊"

    def _handle_navigation(self, message):
        nav_result = self.nav_rag.retrieve_navigation_info(message, top_k=1)
        if nav_result:
            match = nav_result[0]
            return f"{match['description']} 👉 [Go to {match['name']} Page]({match['path']})"
        return None

    def _handle_company_info(self, message, history):
        context = self.company_rag.retrieve_relevant_chunks(message)
        if not context.strip():
            return None

        messages = [{"role": "system", "content": f"{system_instructions}\n\n{context}"}]

        if history and isinstance(history, list):
            trimmed = history[-MAX_CONTEXT_MESSAGES:]
            for user_msg, bot_msg in trimmed:
                messages.append({"role": "user", "content": user_msg})
                messages.append({"role": "assistant", "content": bot_msg})

        messages.append({"role": "user", "content": message})

        response = openai.ChatCompletion.create(
            model=MODEL,
            messages=messages,
            temperature=0.5,
        )
        return response.choices[0].message["content"].strip()
