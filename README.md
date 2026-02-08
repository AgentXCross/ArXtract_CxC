![title](/frontend/src/assets/title.png)

ArXtract is a research intelligence engine that transforms any arXiv paper into structured, queryable insights. It evaluates a paper’s relevance to your research interests, highlights its most important contributions, surfaces related work, and lets you interrogate the paper all through a terminal-style interface.

**Try it Out!** [arxtract-cxc.vercel.app](https://arxtract-cxc.vercel.app)

---

## What It Does

**Paste an arXiv link. Enter your research interests. Get everything you need.**

- **Key Sections** — Extracts title, problem statement, contribution, architecture, datasets, metrics, baselines, results, and limitations into structured fields.
- **Relevance Scoring** — By entering your research topic, you get a 0–100 relevance score with the papers abtract and the top 5 most relevant text chunks
- **Related Papers** — Discovers and ranks similar papers from arXiv based on your research interest by cosine similarity
- **Research Query** — Ask follow-up questions about the paper and get grounded answers with cited chunks
- **Model Flowchart** — Interactive, zoomable diagram showing the full processing pipeline

![System FlowChart](/frontend/src/assets/flowchart.png)

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite (Rolldown) |
| Styling | Custom CSS, macOS terminal-inspired aesthetic |
| Charts | Mermaid.js, custom bar/gauge components |
| Particles | tsParticles |
| Backend | FastAPI, Python |
| LLM | OpenAI GPT-5.2 |
| Embeddings | text-embedding-3-small |
| PDF Parsing | PyMuPDF |
| Vector Math | NumPy (cosine similarity) |
| Deployment | Vercel |

Built for 2026 CxC Hackathon