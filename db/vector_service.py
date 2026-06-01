import os
import uuid
from typing import List
from google import genai
from google.genai import types
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.embeddings import Embeddings

class GoogleGenAIEmbeddings(Embeddings):
    """Custom embedding class using google-genai SDK directly."""
    
    def __init__(self, model: str = "text-embedding-004"):
        self.model = model
        self.client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            result = self.client.models.embed_content(
                model=self.model,
                contents=text
            )
            embeddings.append(result.embeddings[0].values)
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        result = self.client.models.embed_content(
            model=self.model,
            contents=text
        )
        return result.embeddings[0].values


class VectorService:
    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        self.embeddings = GoogleGenAIEmbeddings(model="gemini-embedding-001")
        self.vector_store = Chroma(
            collection_name="spendagent_policies",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )

    def upload_policy_pdf(self, file_path: str) -> int:
        """Chunks and indexes PDFs to the vector store."""
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        chunks = self.text_splitter.split_documents(documents)
        ids = [str(uuid.uuid4()) for _ in chunks]
        self.vector_store.add_documents(documents=chunks, ids=ids)
        return len(chunks)

    def get_relevant_policy(self, query: str, k: int = 3) -> List[str]:
        """Retrieves relevant policy chunks for a given context."""
        docs = self.vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]

vector_service = VectorService()