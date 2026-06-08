import chromadb
from sentence_transformers import SentenceTransformer
import os

# Initialize ChromaDB - stores data locally in a folder called 'chroma_db'
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Get or create a collection (like a table in regular DB)
collection = chroma_client.get_or_create_collection(
    name="meeting_transcripts",
    metadata={"heuristic": "cosine"}  # use cosine similarity for search
)

# Load embedding model once
print("Loading embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Embedding model loaded.")


def add_meeting_to_vector_db(meeting_id: int, title: str, transcript: str, summary: str):
    """
    Chunk the transcript and store embeddings in ChromaDB.
    We chunk because embedding a 10,000 word transcript as one piece
    loses granularity. Smaller chunks = better search results.
    """
    # Split transcript into chunks of ~500 chars with overlap
    chunks = chunk_text(transcript, chunk_size=500, overlap=50)

    documents = []
    embeddings = []
    metadatas = []
    ids = []

    for i, chunk in enumerate(chunks):
        doc_id = f"meeting_{meeting_id}_chunk_{i}"
        embedding = embedding_model.encode(chunk).tolist()

        documents.append(chunk)
        embeddings.append(embedding)
        metadatas.append({
            "meeting_id": str(meeting_id),
            "title": title,
            "chunk_index": i,
            "type": "transcript"
        })
        ids.append(doc_id)

    # Also add summary as a single document
    summary_embedding = embedding_model.encode(summary).tolist()
    documents.append(summary)
    embeddings.append(summary_embedding)
    metadatas.append({
        "meeting_id": str(meeting_id),
        "title": title,
        "chunk_index": -1,
        "type": "summary"
    })
    ids.append(f"meeting_{meeting_id}_summary")

    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )


def search_meetings(query: str, n_results: int = 5):
    query_embedding = embedding_model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    formatted = []
    for i in range(len(results['documents'][0])):
        distance = results['distances'][0][i]
        
        # Filter out weak matches — lower distance = more similar
        # Cosine distance: 0 = identical, 2 = completely opposite
        # Only keep results with distance below 0.8
        if distance < 1.5:            formatted.append({
                "text": results['documents'][0][i],
                "meeting_id": results['metadatas'][0][i]['meeting_id'],
                "title": results['metadatas'][0][i]['title'],
                "type": results['metadatas'][0][i]['type'],
                "distance": round(distance, 3)
            })

    return formatted


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks