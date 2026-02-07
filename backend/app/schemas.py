"""
schemas.py
Pydantic schemas defining request and response data structures
for the backend API.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

class ChunkScore(BaseModel):
    text: str = Field(description = "The chunk text")
    score: float = Field(description = "Cosine similarity score")
    chunk_index: int = Field(description = "Position of the chunk in the paper")

class SimilarityResult(BaseModel):
    abstract_score: float = Field(description = "Cosine similarity between query and abstract")
    abstract_text: str = Field(description = "The extracted abstract text")
    top_chunks: List[ChunkScore] = Field(description = "Top-k most relevant chunks, sorted by score descending")

class RelatedPaper(BaseModel):
    arxiv_id: str = Field(description = "arXiv paper identifier")
    title: str = Field(description = "Paper title")
    authors: List[str] = Field(default_factory = list, description = "List of author names")
    abstract: str = Field(description = "Paper abstract")
    url: str = Field(description = "arXiv URL")
    score: float = Field(description = "Cosine similarity score (0-10)")

class RelatedPapersResult(BaseModel):
    papers: List[RelatedPaper] = Field(description = "Related papers ranked by similarity")

class ChatResponse(BaseModel):
    answer: str = Field(description = "LLM-generated answer based on paper chunks")
    chunks_used: List[ChunkScore] = Field(description = "The chunks used to generate the answer")

class PaperExtraction(BaseModel):
    title: Optional[str] = Field(
        default = None,
        description = "Title of the paper"
    )

    problem_statement: Optional[str] = Field(
        default = None,
        description = "What real-world or technical problem the paper addresses"
    )

    task_type: Optional[str] = Field(
        default = None,
        description = "Type of task (e.g. classification, segmentation, detection)"
    )

    core_contribution: Optional[str] = Field(
        default = None,
        description = "Main novelty or contribution of the paper"
    )

    model_architecture: Optional[str] = Field(
        default = None,
        description = "High-level model architecture description"
    )

    training_details: Optional[str] = Field(
        default = None,
        description = "Key training setup details if mentioned"
    )

    datasets: List[str] = Field(
        default_factory = list,
        description = "Datasets explicitly mentioned"
    )

    evaluation_metrics: List[str] = Field(
        default_factory = list,
        description = "Evaluation metrics used"
    )

    baselines: List[str] = Field(
        default_factory = list,
        description = "Baseline models or methods compared against"
    )

    key_results: Optional[str] = Field(
        default = None,
        description = "Headline results or improvements"
    )

    limitations: Optional[str] = Field(
        default = None,
        description = "Limitations or failure cases noted by authors"
    )

    application_domains: List[str] = Field(
        default_factory = list,
        description = "Application areas of the work"
    )
