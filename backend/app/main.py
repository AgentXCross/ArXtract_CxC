"""
main.py
FastAPI application entry point for the backend service.
The API coordinates the following stages:
- Accepting a user query and arXiv input
- Fetching and parsing the target paper
- Performing similarity-based retrieval
- Applying LLM-based reranking and extraction
- Returning structured analysis results to the frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from app.services.llm_client import extract_basic_info, expand_query, extract_keywords, answer_from_chunks
from app.services.arxiv_client import parse_arxiv_paper, fetch_arxiv_abstract, extract_arxiv_id, chunk_text, strip_references, search_arxiv
from app.services.similarity import rank_chunks, rank_papers, retrieve_top_chunks
from app.schemas import ChatResponse

app = FastAPI(
    title = "Paper Intelligence API",
    version = "0.1.0",
    debug = True
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5173"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# In-memory cache of paper chunks keyed by arxiv_id
paper_chunks_cache: dict[str, list[str]] = {}

@app.get("/health")
def health_check():
    return {"status": "ok"}

class ArxivRequest(BaseModel):
    arxiv_id: str

class SimilarityRequest(BaseModel):
    arxiv_id: str
    query: str

@app.post("/paper/from-arxiv")
def paper_from_arxiv(req: ArxivRequest):
    """paper_from_arxiv(req) analyzes an arXiv paper given a user query and arXiv identifier or URL."""
    try:
        text = parse_arxiv_paper(req.arxiv_id)
    except ValueError as e:
        raise HTTPException(
            status_code = 400,
            detail = f"Invalid arXiv input: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail = f"arXiv parsing failed: {str(e)}"
        )

    try:
        result = extract_basic_info(text)
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail = f"LLM extraction failed: {e}"
        )
    return result


@app.post("/paper/similarity")
def paper_similarity(req: SimilarityRequest):
    """paper_similarity(req) computes the relevance of an arXiv paper to a user’s research interest."""
    try:
        text = parse_arxiv_paper(req.arxiv_id)
    except ValueError as e:
        raise HTTPException(status_code = 400, detail = f"Invalid arXiv input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"arXiv parsing failed: {str(e)}")

    arxiv_id = extract_arxiv_id(req.arxiv_id)
    abstract = fetch_arxiv_abstract(arxiv_id)
    text = strip_references(text)
    chunks = chunk_text(text)

    # Cache chunks for the chat endpoint
    paper_chunks_cache[arxiv_id] = chunks

    expanded = expand_query(req.query)

    try:
        result = rank_chunks(query = expanded, abstract = abstract, chunks = chunks)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Similarity computation failed: {str(e)}")

    return result


@app.post("/paper/related")
def paper_related(req: SimilarityRequest):
    """paper_related(req) finds related arXiv papers by searching with extracted keywords and ranking by similarity."""
    try:
        input_arxiv_id = extract_arxiv_id(req.arxiv_id)
    except ValueError as e:
        raise HTTPException(status_code = 400, detail = f"Invalid arXiv input: {str(e)}")

    expanded = expand_query(req.query)
    keywords = extract_keywords(req.query)

    try:
        papers = search_arxiv(keywords)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"arXiv search failed: {str(e)}")

    # Exclude the input paper from results
    papers = [p for p in papers if p["arxiv_id"] != input_arxiv_id]

    try:
        result = rank_papers(query = expanded, papers = papers)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Paper ranking failed: {str(e)}")

    return result


@app.post("/paper/chat")
def paper_chat(req: SimilarityRequest):
    """paper_chat(req) answers a follow-up question about a paper using chunk retrieval + LLM."""
    try:
        arxiv_id = extract_arxiv_id(req.arxiv_id)
    except ValueError as e:
        raise HTTPException(status_code = 400, detail = f"Invalid arXiv input: {str(e)}")

    # Get chunks from cache or fetch/chunk on demand
    if arxiv_id not in paper_chunks_cache:
        try:
            text = parse_arxiv_paper(req.arxiv_id)
        except Exception as e:
            raise HTTPException(status_code = 500, detail = f"arXiv parsing failed: {str(e)}")
        text = strip_references(text)
        paper_chunks_cache[arxiv_id] = chunk_text(text)

    chunks = paper_chunks_cache[arxiv_id]

    try:
        top_chunks = retrieve_top_chunks(query = req.query, chunks = chunks, k = 15)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Chunk retrieval failed: {str(e)}")

    chunk_texts = [c.text for c in top_chunks]

    try:
        answer = answer_from_chunks(query = req.query, chunks = chunk_texts)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Answer generation failed: {str(e)}")

    return ChatResponse(answer = answer, chunks_used = top_chunks)

