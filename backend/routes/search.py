from flask import Blueprint, request, jsonify
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embeddings import search_meetings
from config import Config
from groq import Groq

search_bp = Blueprint('search', __name__)

groq_client = Groq(api_key=Config.GROQ_API_KEY)


@search_bp.route('/api/search', methods=['POST'])
def semantic_search():
    """
    Semantic search endpoint.
    Takes a query, finds similar meeting chunks, returns them.
    """
    data = request.get_json()
    query = data.get('query', '')

    if not query:
        return jsonify({"error": "Query is required"}), 400

    results = search_meetings(query, n_results=5)
    return jsonify({"results": results})


@search_bp.route('/api/ask', methods=['POST'])
def ask_across_meetings():
    """
    RAG endpoint: ask a question, get an answer grounded in your meetings.

    Flow:
    1. Semantic search finds relevant meeting chunks
    2. We inject those chunks into the prompt as context
    3. Groq answers using ONLY that context
    4. This is RAG - Retrieval Augmented Generation
    """
    data = request.get_json()
    question = data.get('question', '')

    if not question:
        return jsonify({"error": "Question is required"}), 400

    # Step 1: Retrieve relevant context
    relevant_chunks = search_meetings(question, n_results=5)

    if not relevant_chunks:
        return jsonify({
            "answer": "No relevant meeting data found.",
            "sources": []
        })

    # Step 2: Build context string from retrieved chunks
    context = "\n\n---\n\n".join([
        f"From meeting '{chunk['title']}':\n{chunk['text']}"
        for chunk in relevant_chunks
    ])

    # Step 3: Augmented prompt with retrieved context
    prompt = f"""You are a meeting intelligence assistant. Answer the user's question using ONLY the meeting context provided below. If the answer isn't in the context, say so clearly.

MEETING CONTEXT:
{context}

USER QUESTION:
{question}

Answer based strictly on the meeting context above:"""

    # Step 4: Generate answer using Groq
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=1000
    )

    answer = response.choices[0].message.content
    sources = list(set([c['title'] for c in relevant_chunks]))

    return jsonify({
        "answer": answer,
        "sources": sources
    })