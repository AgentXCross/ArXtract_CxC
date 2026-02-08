"""
llm_client.py
Client utilities for interacting with a large language model (LLM)
to perform reasoning tasks over research paper text.

This module is responsible for:
- Sending structured prompts to an LLM
- Interpreting and validating LLM outputs
- Using the LLM for semantic reranking and relevance judgment

Primary use cases:
- Reranking candidate text chunks selected via embedding similarity
- Selecting the most relevant sections of a paper for a given user query
- Performing reasoning over already-extracted text

This module does NOT:
- Perform embedding or similarity computation
- Fetch or parse PDFs
- Handle API routing or request validation

All inputs to this module are assumed to be preprocessed and
retrieved by earlier stages in the pipeline.

Functions in this program:
- extract_basic_info
- rerank_chunks
- score_abstract_relevance
- clean_chunks
- expand_query
- extract_keywords
- answer_from_chunks
"""

import json
import re
from openai import OpenAI
from app.config import OPENAI_MODEL
from app.schemas import PaperExtraction

client = OpenAI()

# 
def extract_basic_info(text: str) -> dict:
    """
    extract_basic_info(text) extracts metadata from a research paper using an LLM.
    This function prompts an LLM to identify and extract core
    informational fields such as the paper's task, methodology,
    application domain, etc.
    The returned information is intended to provide a lightweight,
    human-readable overview of the paper.
    """
    prompt = f"""
        You are analyzing the text of a machine learning research paper.

        Your goal is to extract structured, high-level information that helps a researcher
        quickly decide whether this paper is relevant to their work.

        Do NOT speculate. Only extract what is clearly stated or strongly implied.
        If information is missing, use null or an empty list.

        Extract the following fields:

        - title: paper title
        - problem_statement: What real-world or technical problem is being addressed (2-4 sentences)
        - task_type: e.g. Classification, Regression, Segmentation, Detection, Generation, Forecasting, Reinforcement Learning, Representation Learning, Object Detection
        - core_contribution: the main idea or novelty of the paper (2-4 sentences)
        - model_architecture: high-level model description the paper uses (no layer-by-layer detail). Paper may use multiple models or just one. (2-5 sentences)
        - training_details: key training setup if mentioned (loss functions, optimizers, supervision type, pretraining). Omit details that aren't present. (2-5 sentences)
        - datasets: List of dataset names explicitly mentioned. Give explicit names if possible. If and only if you can find it give the full name of the dataset in parentheses after the dataset acronym if applicable (e.g. IDRiD (Indian Diabetic Retinopathy Image Dataset))
        - evaluation_metrics: list of metrics used. If the metric is an acronym for a pretty long metric like PR-AUC name it out fully (e.g. F1/Dice, IoU (Intersection over Union), Accuracy, Precision, Recall, PR-AUC, ROC-AUC, MSE (Mean Squared Error))
        - baselines: Models or methods explicitly compared against in experiments. Only include baselines named in the paper. (2-4 Sentences)
        - key_results: hightlight key quantitative results or improvements if explicitly stated (2-4 Sentences). If no clear numerical improvements are stated, respond with "Not explicitly stated."
        - limitations: Limitations or failure cases explicitly mentioned by the authors. (2-4 Setences). If none are stated, respond with "Not discussed by the authors."
        - application_domains: application areas (e.g. Healthcare & Medical Imaging, NLP, Robotics, Autonomous Driving, Finance & Economics, Biology & Genomics, Industrial, Climate)

        Rules:
        - Be concise.
        - datasets, evaluation_metrics, baselines, application_domains must be lists.
        - Output MUST be valid JSON only.
        - No markdown, no explanation text.

        JSON format:
        {{
        "title": string | null,
        "problem_statement": string | null,
        "task_type": string | null,
        "core_contribution": string | null,
        "model_architecture": string | null,
        "training_details": string | null,
        "datasets": list[string],
        "evaluation_metrics": list[string],
        "baselines": list[string],
        "key_results": string | null,
        "limitations": string | null,
        "application_domains": list[string]
        }}

        Paper text:
        {text[:30000]}
        """
    response = client.chat.completions.create(
        model = OPENAI_MODEL,
        messages = [{"role": "user", "content": prompt}],
        temperature = 0.0
    )

    raw_content = response.choices[0].message.content or ""

    # Strip markdown fences if the LLM wraps its response
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw response: {raw_content[:500]}")

    try:
        paper = PaperExtraction(**data)
    except Exception as e:
        raise ValueError(f"LLM output failed schema validation: {e}")

    return paper


def rerank_chunks(query: str, chunks: list[dict]) -> list[int]:
    """
    rerank_chunks(query, chunks) reranks candidate text chunks using an LLM-based relevance judgment.
    Given a user query and a list of candidate chunks (each with 'index' and 'text'),
    the LLM to pick the 5 most relevant chunks.
    Returns a list of indices into the input chunks list.
    """
    numbered_chunks = "\n".join(
        f"[{i}] {c['text']}" for i, c in enumerate(chunks)
    )

    prompt = f"""You are a research paper relevance judge.
        A user is searching for: "{query}"
        Below are {len(chunks)} text chunks from a research paper, each labeled with an index.
        {numbered_chunks}
        Pick the 5 chunks that are most relevant to the user's query.
        Return ONLY a JSON array of their indices. No ranking needed, just the 5 best.
        Output ONLY the JSON array, nothing else."""

    response = client.chat.completions.create(
        model = OPENAI_MODEL,
        messages = [{"role": "user", "content": prompt}],
        temperature = 0.0,
    )

    raw = response.choices[0].message.content.strip()

    try:
        indices = json.loads(raw)
    except json.JSONDecodeError:
        return list(range(min(5, len(chunks)))) # Fallback (return first 5)

    # Validate indices are in range
    valid = [i for i in indices if isinstance(i, int) and 0 <= i < len(chunks)]
    if len(valid) < 5:
        # Fill with remaining top indices not already selected
        for i in range(len(chunks)):
            if i not in valid:
                valid.append(i)
            if len(valid) >= 5:
                break

    return valid[:5]


def score_abstract_relevance(query: str, abstract: str) -> float:
    """score_abstract_relevance asks the LLM to rate how relevant an abstract is to the user's query (0–100)."""
    prompt = f"""You are a research relevance judge.
        A researcher is looking for: "{query}"
        Here is a paper's abstract:
        "{abstract}"
        Rate how relevant this paper is to the researcher's interest on a scale of 0 to 100.
        0   = Completely unrelated topic or domain.
        25  = Same general field (e.g. ML) but no shared task, methods, or application.
        50  = Shares either task OR application domain, but not both. Limited practical usefulness.
        75  = Shares task or methodology AND application domain. Likely useful background or baseline.
        100 = Direct match in task, methodology, and application domain. Highly likely to influence the research.
        Consider topical overlap, methodology relevance, and practical usefulness.
        Do not consider writing quality or paper importance. Judge relevance only.
        Return ONLY a single integer between 0 and 100. Nothing else.
        """

    response = client.chat.completions.create(
        model = OPENAI_MODEL,
        messages = [{"role": "user", "content": prompt}],
        temperature = 0.0,
    )

    raw = response.choices[0].message.content.strip()

    try:
        score = int(raw)
        return float(max(0, min(100, score)))
    except ValueError:
        # Try to extract a number from the response
        match = re.search(r'\d+', raw)
        if match:
            return float(max(0, min(100, int(match.group()))))
        return 50.0


def expand_query(query: str) -> str:
    """
    expand_query(query) uses an LLM to enrich the user's search query with
    related technical synonyms and task clarifications to improve retrieval recall.
    The original intent of the query is preserved.
    """
    prompt = f"""You are a search query expansion assistant for academic research papers.
    Given the user's research query, expand it by adding related technical synonyms,
    alternative phrasings, and task clarifications. Do NOT change the user's intent.
    Rules:
    - Add relevant technical terms, acronyms, and synonyms that a paper might use.
    - Do not add unrelated topics.
    - Return ONLY the expanded query text, nothing else.
    User query: "{query}"
    Expanded query:"""
    try:
        response = client.chat.completions.create(
            model = OPENAI_MODEL,
            messages = [{"role": "user", "content": prompt}],
            temperature = 0.0,
        )
        expanded = response.choices[0].message.content.strip()
        return expanded if expanded else query
    except Exception:
        return query

def extract_keywords(query: str) -> str:
    """
    extract_keywords(query) uses an LLM to extract the most important
    search keywords from the user's query for arXiv API search.
    Returns a space-separated keyword string.
    """
    prompt = f"""You are a keyword extraction assistant for academic paper search.
    Given the user's research query, extract the 3-5 most important search keywords
    or short phrases that would find relevant papers on arXiv.
    Rules:
    - Focus on technical terms, methods, and domain-specific vocabulary.
    - Return ONLY the keywords separated by spaces, nothing else.
    - Do not include filler words like "using", "for", "with", etc.
    User query: "{query}"
    Keywords:"""
    try:
        response = client.chat.completions.create(
            model = OPENAI_MODEL,
            messages = [{"role": "user", "content": prompt}],
            temperature = 0.0,
        )
        keywords = response.choices[0].message.content.strip()
        return keywords if keywords else query
    except Exception:
        return query


def answer_from_chunks(query: str, chunks: list[str]) -> str:
    """
    answer_from_chunks(query, chunks) uses an LLM to answer the user's question
    based on the most relevant paper excerpts retrieved by cosine similarity.
    """
    numbered = "\n\n".join(
        f"[Excerpt {i+1}]\n{chunk}" for i, chunk in enumerate(chunks)
    )

    prompt = f"""You are a research paper assistant. A user is asking a question about a specific paper.
    Answer the user's question using ONLY the provided paper excerpts below.
    If the excerpts don't contain enough information to answer, say so honestly.
    Be concise, specific, and cite which excerpt(s) your answer draws from when relevant.
    User question: "{query}"
    Paper excerpts:
    {numbered}
    Answer:"""
    try:
        response = client.chat.completions.create(
            model = OPENAI_MODEL,
            messages = [{"role": "user", "content": prompt}],
            temperature = 0.0,
        )
        answer = response.choices[0].message.content.strip()
        return answer if answer else "I couldn't generate an answer from the available excerpts."
    except Exception as e:
        return f"Error generating answer: {str(e)}"


def clean_chunks(chunks: list[str]) -> list[str]:
    """
    clean_chunks post-processes the top 5 chunks with an LLM to remove noise
    (figure captions, table fragments, equations, page headers, etc.)
    and return only the meaningful, readable content from each chunk.
    """
    # Rejoin hyphenated line breaks
    chunks = [re.sub(r'-\s*\n\s*', '', c) for c in chunks]
    # Also catch hyphen followed by whitespace mid-word
    chunks = [re.sub(r'(\w)-\s+(\w)', r'\1\2', c) for c in chunks]
    numbered = "\n\n".join(
        f"[{i}]\n{chunk}" for i, chunk in enumerate(chunks)
    )
    prompt = f"""
        You are performing strict text cleanup on raw PDF-extracted research text.
        You will receive {len(chunks)} numbered chunks.
        Your task is PURELY DELETION-BASED CLEANING.
        For each chunk:
        - Keep original sentences EXACTLY as written.
        - Preserve original sentence order.
        - Remove only:
        • Figure or table captions
        • Inline citation markers like [1], (Smith et al., 2020)
        • Page numbers or headers/footers
        • Raw equations or equation fragments
        • Isolated numeric/table fragments
        • Author affiliations or metadata
        • Broken sentence fragments
        Rules:
        - Do NOT summarize.
        - Do NOT paraphrase.
        - Do NOT rewrite sentences.
        - Do NOT merge sentences.
        - Do NOT add new text.
        - If a chunk contains no meaningful prose, return an empty string.

        Return a JSON array of length {len(chunks)}.
        Each element must correspond to the cleaned version of the same index.
        Output ONLY the JSON array.

        Here are the chunks:
        {numbered}
        """
    response = client.chat.completions.create(
        model = OPENAI_MODEL,
        messages = [{"role": "user", "content": prompt}],
        temperature = 0.0,
    )
    raw = response.choices[0].message.content.strip()
    try:
        cleaned = json.loads(raw)
        if isinstance(cleaned, list) and len(cleaned) == len(chunks):
            return [str(c) for c in cleaned]
    except json.JSONDecodeError:
        pass
    return chunks
