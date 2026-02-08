"""
arxiv_client.py
This program contains client utilities for interacting with the arXiv API and retrieving paper metadata
and PDFs given an arXiv identifier or URL. 
This module is responsible for:
- Normalizing user-provided arXiv inputs (raw IDs, abs URLs, or pdf URLs)
- Fetching paper metadata from the arXiv API
- Downloading the corresponding PDF when required
- Providing a clean interface for the rest of the backend to access arXiv content
All returned data is intended to be consumed by other services.

Functions in this program:
- extract_arxiv_id
- fetch_arxiv_pdf
- _parse_pdf
- fetch_arxiv_abstract
- search_arxiv
- strip_references
- remove_symbol_noise
- _split_sentences
- chunk_text
- parse_arxiv_paper
"""

import re
import xml.etree.ElementTree as ET
import requests
import fitz

ARXIV_PDF_BASE_URL = "https://arxiv.org/pdf/"
ARXIV_API_BASE_URL = "http://export.arxiv.org/api/query"

def extract_arxiv_id(arxiv_input: str) -> str:
    """
    extract_arxiv_id(arxiv_input) extracts and normalizes an arXiv identifier from the user-provided input string.
    Accepts full arXiv URL, arXiv PDF URL, or raw arXiv Identifier.
        For Example, the following are all valid inputs (Provided the ID string exists):
        - 1111.11111
        - 2401.01234
        - 2401.01234v2
        - https://arxiv.org/abs/2401.01234
        - https://arxiv.org/pdf/2401.01234.pdf
    Returns arXiv ID string (without version suffix).
        For Example: "2401.01234"
    Raises ValueError if no arXiv identifier can be extracted from the input.
    """
    arxiv_input = arxiv_input.strip() # Strip whitespaces

    # Match raw ID
    raw_match = re.match(r"(\d{4}\.\d{4,5})(?:v\d+)?$", arxiv_input)
    if raw_match:
        return raw_match.group(1)

    # Match URL
    url_match = re.search(r"arxiv\.org/(abs|pdf)/(\d{4}\.\d{4,5})", arxiv_input)
    if url_match:
        return url_match.group(2)

    raise ValueError("Invalid arXiv identifier or URL")


def fetch_arxiv_pdf(arxiv_id: str) -> bytes:
    """
    fetch_arxiv_pdf(arxiv_id) returns the arXiv PDF as bytes for the given paper ID.
    """
    pdf_url = f"{ARXIV_PDF_BASE_URL}{arxiv_id}.pdf"
    response = requests.get(
        pdf_url,
        headers = {"User-Agent": "ArXtract/0.1"},
        timeout = 90,
    )
    if response.status_code != 200:
        raise ValueError(
            f"Failed to download arXiv PDF (status {response.status_code})"
        )
    return response.content

def _parse_pdf(pdf_bytes: bytes) -> str:
    """
    _parse_pdf parses PDF bytes and extracts text content.
    Function takes raw PDF bytes, loads the document into memory,
    and extracts readable text for further processing.
    """
    doc = fitz.open(stream = pdf_bytes, filetype = "pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def fetch_arxiv_abstract(arxiv_id: str) -> str:
    """
    fetch_arxiv_abstract fetches the abstract directly from the arXiv Atom API.
    The abstract is returned as plain text and is intended for similarity scoring.
    """
    response = requests.get(
        ARXIV_API_BASE_URL,
        params = {"id_list": arxiv_id},
        headers = {"User-Agent": "ArXtract/0.1"},
        timeout = 90,
    )
    if response.status_code != 200:
        raise ValueError(f"arXiv API request failed (status {response.status_code})")

    root = ET.fromstring(response.text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    entry = root.find("atom:entry", ns)
    if entry is None:
        raise ValueError("Paper not found on arXiv")

    summary = entry.find("atom:summary", ns)
    if summary is None or not summary.text:
        raise ValueError("No abstract available for this paper")

    abstract = re.sub(r'\s+', ' ', summary.text.strip())
    return abstract

def search_arxiv(keywords: str, max_results: int = 5) -> list[dict]:
    """
    search_arxiv(keywords) queries the arXiv API with the given keywords
    and returns a list of matching papers with their metadata.
    Each paper dict contains: arxiv_id, title, authors, abstract, url.
    """
    response = requests.get(
        ARXIV_API_BASE_URL,
        params = {
            "search_query": f"all:{keywords}",
            "max_results": max_results,
            "sortBy": "relevance",
            "sortOrder": "descending",
        },
        headers = {"User-Agent": "ArXtract/0.1"},
        timeout = 90,
    )
    if response.status_code != 200:
        raise ValueError(f"arXiv search failed (status {response.status_code})")

    root = ET.fromstring(response.text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    papers = []
    for entry in root.findall("atom:entry", ns):
        # Extract arXiv ID from the entry id URL
        entry_id = entry.find("atom:id", ns)
        if entry_id is None or not entry_id.text:
            continue
        # ID looks like http://arxiv.org/abs/2401.01234v1
        arxiv_id_match = re.search(r"(\d{4}\.\d{4,5})", entry_id.text)
        if not arxiv_id_match:
            continue
        arxiv_id = arxiv_id_match.group(1)

        title_el = entry.find("atom:title", ns)
        title = re.sub(r'\s+', ' ', title_el.text.strip()) if title_el is not None and title_el.text else "Untitled"

        summary_el = entry.find("atom:summary", ns)
        abstract = re.sub(r'\s+', ' ', summary_el.text.strip()) if summary_el is not None and summary_el.text else ""

        authors = []
        for author_el in entry.findall("atom:author", ns):
            name_el = author_el.find("atom:name", ns)
            if name_el is not None and name_el.text:
                authors.append(name_el.text.strip())

        papers.append({
            "arxiv_id": arxiv_id,
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "url": f"https://arxiv.org/abs/{arxiv_id}",
        })

    return papers


def strip_references(text: str) -> str:
    """strip_references(text) removes the References/Bibliography section and everything after it."""
    pattern = re.compile(
        r'\n\s*(?:References|REFERENCES|Bibliography|BIBLIOGRAPHY)\s*\n',
    )
    match = pattern.search(text)
    if match:
        return text[:match.start()].strip()
    return text

def remove_symbol_noise(text: str) -> str:
    """remove_symbol_noise(str) removes unicode junk and repeated non-alphanumeric symbols from PDF text."""
    # Remove circled numbers and math-like unicode junk
    text = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩]", "", text)
    text = re.sub(r"[¿¡¬√]", "", text)
    # Remove repeated non-alphanumeric symbols
    text = re.sub(r"[^\w\s.,;:()\-/%]+", " ", text)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

def _split_sentences(text: str) -> list[str]:
    """_split_sentences(str) splits text into sentences on . ! ? followed by whitespace or end."""
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s for s in parts if s]


def chunk_text(text: str, max_words: int = 250) -> list[str]:
    """
    Split paper text into sentence-aware chunks of ~250 words.
    Each chunk starts at a sentence boundary. Consecutive chunks
    overlap by one sentence for continuity.
    """
    cleaned = remove_symbol_noise(text)
    sentences = _split_sentences(cleaned)
    if not sentences:
        return []

    chunks = []
    i = 0
    while i < len(sentences):
        current_words = 0
        j = i
        while j < len(sentences) and current_words < max_words:
            current_words += len(sentences[j].split())
            j += 1
        chunk = " ".join(sentences[i:j])
        if chunk:
            chunks.append(chunk)
        if j >= len(sentences):
            break
        # Overlap: next chunk starts one sentence back
        i = max(j - 1, i + 1)
    return chunks

def parse_arxiv_paper(arxiv_input: str) -> str:
    """
    parse_arxiv_paper(arxiv_input) downloads and parses the full text of an arXiv paper.

    This function orchestrates the initial ingestion pipeline by
    normalizing a user-provided arXiv input, downloading the
    corresponding PDF, and extracting raw text from the document.

    No text cleaning, reference stripping, or chunking is performed.
    Those steps are handled by later services
    """
    try:
        arxiv_id = extract_arxiv_id(arxiv_input)                        # Get the ID
        print(f"DEBUG arxiv_id: {arxiv_id}")
        pdf_bytes = fetch_arxiv_pdf(arxiv_id)                           # Download the pdf
        print(f"DEBUG PDF fetched successfully")
        text = _parse_pdf(pdf_bytes)                                    # Extract the text
        print(f"DEBUG PDF parsed, extracted {len(text)} characters")
        return text
    except Exception as e:
        print(f"DEBUG ERROR in parse_arxiv_paper: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise
