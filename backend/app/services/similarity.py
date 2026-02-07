"""
similarity.py
Utilities for computing semantic similarity between user queries and
research paper text using vector embeddings.
This module is responsible for:
- Encoding text into vector representations
- Computing similarity scores between a query and candidate text chunks
- Selecting the most relevant chunks based on similarity scores
- Providing a fast, deterministic retrieval step prior to LLM-based reranking
"""

import numpy as np
from openai import OpenAI
from app.config import OPENAI_EMBEDDING_MODEL
from app.schemas import ChunkScore, SimilarityResult, RelatedPaper, RelatedPapersResult
from app.services.llm_client import rerank_chunks, clean_chunks, score_abstract_relevance

client = OpenAI()

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    get_embeddings(texts) computes vector embeddings for a list of text inputs.
    This function encodes each input string into a fixed-length
    numerical vector suitable for semantic similarity comparison.
    The returned embeddings are intended to be used with cosine
    similarity or other distance-based retrieval methods.
    """
    response = client.embeddings.create(
        model = OPENAI_EMBEDDING_MODEL,
        input = texts,
    )
    return [item.embedding for item in response.data]

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    score = float(dot / norm)
    return float(max(0.0, score))

def rank_chunks(query: str, abstract: str, chunks: list[str]) -> SimilarityResult:
    """
    rank_chunks(query, abstract, chunks)
    Two-stage retrieval pipeline:
    1. Embed query, abstract, and all chunks; compute cosine scores (clamped to 0)
    2. Take top 20 chunks by cosine score
    3. LLM reranks to pick the best 5
    4. Return full chunk text with its score
    """
    # Embed everything in one batch call for efficiency
    all_texts = [query, abstract] + chunks
    embeddings = get_embeddings(all_texts)

    query_emb = embeddings[0]
    abstract_emb = embeddings[1]
    chunk_embs = embeddings[2:]

    # Score abstract: average cosine similarity (×100) with LLM relevance score
    cosine_abstract = max(cosine_similarity(query_emb, abstract_emb), 0.0) * 100
    llm_abstract = score_abstract_relevance(query, abstract)
    abstract_score = (cosine_abstract + llm_abstract) / 2

    # Score each chunk, clamp negatives to 0
    scored_chunks = []
    for i, chunk_emb in enumerate(chunk_embs):
        score = max(cosine_similarity(query_emb, chunk_emb), 0.0)
        scored_chunks.append(ChunkScore(
            text = chunks[i],
            score = round(score, 3),
            chunk_index = i,
        ))

    # Sort by score descending, take top 20 candidates
    scored_chunks.sort(key = lambda c: c.score, reverse = True)
    top_20 = scored_chunks[:20]

    # LLM reranks to pick the best 5
    candidate_dicts = [{"index": i, "text": c.text} for i, c in enumerate(top_20)]
    best_indices = rerank_chunks(query, candidate_dicts)

    # Collect the 5 winning chunks
    selected = [top_20[idx] for idx in best_indices]

    # LLM cleans noise (figure captions, equations, etc.) from each chunk
    raw_texts = [c.text for c in selected]
    cleaned_texts = clean_chunks(raw_texts)

    top_chunks = []
    for chunk, cleaned in zip(selected, cleaned_texts):
        top_chunks.append(ChunkScore(
            text = cleaned,
            score = round(chunk.score * 10, 3),
            chunk_index = chunk.chunk_index,
        ))

    return SimilarityResult(
        abstract_score = round(abstract_score, 3),
        abstract_text = abstract,
        top_chunks = top_chunks,
    )


def rank_papers(query: str, papers: list[dict]) -> RelatedPapersResult:
    """
    rank_papers(query, papers) ranks a list of papers by cosine similarity
    between the query and each paper's abstract.
    Returns a RelatedPapersResult with papers sorted by score descending.
    """
    if not papers:
        return RelatedPapersResult(papers = [])

    abstracts = [p["abstract"] for p in papers]
    all_texts = [query] + abstracts
    embeddings = get_embeddings(all_texts)

    query_emb = embeddings[0]
    abstract_embs = embeddings[1:]

    scored = []
    for i, paper in enumerate(papers):
        score = max(cosine_similarity(query_emb, abstract_embs[i]), 0.0) * 10
        scored.append(RelatedPaper(
            arxiv_id = paper["arxiv_id"],
            title = paper["title"],
            authors = paper["authors"],
            abstract = paper["abstract"],
            url = paper["url"],
            score = round(score, 3),
        ))

    scored.sort(key = lambda p: p.score, reverse = True)
    return RelatedPapersResult(papers = scored)


def retrieve_top_chunks(query: str, chunks: list[str], k: int = 15) -> list[ChunkScore]:
    """
    retrieve_top_chunks(query, chunks, k) finds the k most relevant chunks
    by cosine similarity to the query. Returns ChunkScore objects sorted by score.
    """
    if not chunks:
        return []

    all_texts = [query] + chunks
    embeddings = get_embeddings(all_texts)

    query_emb = embeddings[0]
    chunk_embs = embeddings[1:]

    scored = []
    for i, chunk_emb in enumerate(chunk_embs):
        score = max(cosine_similarity(query_emb, chunk_emb), 0.0)
        scored.append(ChunkScore(
            text = chunks[i],
            score = round(score * 10, 3),
            chunk_index = i,
        ))

    scored.sort(key = lambda c: c.score, reverse = True)
    return scored[:k]
