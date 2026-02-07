import { useState } from "react";
import ShellFieldDisplay from "./components/ShellFieldDisplay";
import NavBar from "./components/NavBar";
import AnimatedTitle from "./components/AnimatedTitle";
import FeatureCard from "./components/FeatureCard";
import ChunkBarChart from "./components/ChunkBarChart";
import AbstractScoreGauge from "./components/AbstractScoreGauge";
import ParticlesPanel from "./components/ParticlesPanel";
import RelatedPapersChart from "./components/RelatedPapersChart";
import ChatPanel from "./components/ChatPanel";
import "./App.css"

interface ChunkScore {
  text: string;
  score: number;
  chunk_index: number;
}

interface SimilarityResult {
  abstract_score: number;
  abstract_text: string;
  top_chunks: ChunkScore[];
}

interface RelatedPaper {
  arxiv_id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  score: number;
}

interface RelatedPapersResult {
  papers: RelatedPaper[];
}

interface PaperAnalysis {
  title: string | null;
  problem_statement: string | null;
  task_type: string | null;
  core_contribution: string | null;
  model_architecture: string | null;
  training_details: string | null;
  datasets: string[];
  evaluation_metrics: string[];
  baselines: string[];
  key_results: string | null;
  limitations: string | null;
  application_domains: string[];
}

export default function App() {
  const [arxivInput, setArxivInput] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"relevance" | "key_sections" | "related_papers" | "research_query">("key_sections");

  const [response, setResponse] = useState<PaperAnalysis | null>(null);
  const [similarity, setSimilarity] = useState<SimilarityResult | null>(null);
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setError(null);
    setResponse(null);
    setSimilarity(null);
    setRelatedPapers(null);
    setLoading(true);

    try {
      if (!arxivInput.trim()) {
        throw new Error("Please enter an arXiv ID or link.");
      }

      // Always fetch paper extraction
      const extractionPromise = fetch("http://localhost:8000/paper/from-arxiv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arxiv_id: arxivInput }),
      });

      // Fetch similarity and related papers only if user provided a research prompt
      const similarityPromise = userPrompt.trim()
        ? fetch("http://localhost:8000/paper/similarity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ arxiv_id: arxivInput, query: userPrompt }),
          })
        : null;

      const relatedPromise = userPrompt.trim()
        ? fetch("http://localhost:8000/paper/related", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ arxiv_id: arxivInput, query: userPrompt }),
          })
        : null;

      const extractionRes = await extractionPromise;
      if (!extractionRes.ok) {
        throw new Error("Failed to analyze arXiv paper.");
      }
      const data: PaperAnalysis = await extractionRes.json();
      setResponse(data);

      if (similarityPromise) {
        const simRes = await similarityPromise;
        if (!simRes.ok) {
          throw new Error("Similarity computation failed.");
        }
        const simData: SimilarityResult = await simRes.json();
        setSimilarity(simData);
      }

      if (relatedPromise) {
        const relRes = await relatedPromise;
        if (!relRes.ok) {
          throw new Error("Related papers search failed.");
        }
        const relData: RelatedPapersResult = await relRes.json();
        setRelatedPapers(relData.papers);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <NavBar />
      {/* Introduction Section */}
      <div
        style={{
          position: "relative",
          minHeight: "70vh",
          width: "93vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
          marginTop: "72px",
          boxSizing: "border-box",
        }}
      >
        {/* Hero Section Background */}
        <ParticlesPanel />

        {/* Hero Section Content (Title + Subtitle) */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            paddingLeft: "2rem",
            paddingRight: "2rem",
            letterSpacing: "-1.7px"
          }}
        >
          <AnimatedTitle />

          <h2 style={{
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 400,
            fontSize: "3.0rem",
            color: "#e6effcdb",
            marginTop: "0",
            marginLeft: "0",
            marginRight: "0",
            marginBottom: "0.5rem",
            textAlign: "left",
            lineHeight: 0.95,
            letterSpacing: "-0.9px",
            WebkitTextStroke: "0.5px #d4ff00ba",
          }}>
            AI Search Engine For ML Research
          </h2>
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{
        maxWidth: 1200,
        margin: "3rem auto 3rem",
        padding: "0 2rem",
        display: "flex",
        gap: "2rem",
        justifyContent: "center"
      }}>
        <FeatureCard 
        delay={200}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
          <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 0 0 3 3h15a3 3 0 0 1-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125ZM12 9.75a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H12Zm-.75-2.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75ZM6 12.75a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5H6Zm-.75 3.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75ZM6 6.75a.75.75 0 0 0-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75v-3A.75.75 0 0 0 9 6.75H6Z" clipRule="evenodd" />
          <path d="M18.75 6.75h1.875c.621 0 1.125.504 1.125 1.125V18a1.5 1.5 0 0 1-3 0V6.75Z" />
        </svg>
        }
        title="Search & Analyze" 
        description="Enter an arXiv link or ID to extract key insights" />

        <FeatureCard 
        delay={450}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
          <path d="M8.25 10.875a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Z" />
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.125 4.5a4.125 4.125 0 1 0 2.338 7.524l2.007 2.006a.75.75 0 1 0 1.06-1.06l-2.006-2.007a4.125 4.125 0 0 0-3.399-6.463Z" clipRule="evenodd" />
        </svg>
        }
        title="Semantic Search" description="Locate relevant sections using AI-powered similarity search" />

        <FeatureCard 
        delay={700}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
            <path fillRule="evenodd" d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z" clipRule="evenodd" />
          </svg>
        }
        title="Discover Papers" description="Get ranked recommendations from arXiv" />
        <FeatureCard 
        delay={1000}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
          </svg>

        }
        title="Research Query" description="Chat with the document and get answers supported by its text." />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem 2rem" }}>

        {/* ARXIV INPUT SECTION */}
        <div style={{ marginTop: "1.5rem" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            fontSize: "1.3rem",
            textAlign: "left",
            letterSpacing: "-0.5px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
            Enter either an arXiv Link or Identifer below:
          </label>
          <input
            type="text"
            placeholder="1111.11111 or https://arxiv.org/abs/1111.11111"
            value={arxivInput}
            onChange={(e) => setArxivInput(e.target.value)}
            style={{
              width: "100%",
              height: "48px",
              padding: "0 0.75rem",
              borderRadius: 8,
              border: "2px solid #ccff00",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.95rem",
              background: "#0f0f0f",
              color: "#ccff00",
              caretColor: "#ccff00",
              outline: "none",
            }}
          />
        </div>

        {/* USER RESEARCH PROMPT */}
        <div style={{ marginTop: "1.5rem" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            fontSize: "1.3rem",
            textAlign: "left",
            letterSpacing: "-0.5px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
            Briefly describe the research topic your exploring:
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g., I'm researching semantic segmentation models to improve the..."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "0.75rem",
              borderRadius: 8,
              border: "2px solid #ccff00",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.95rem",
              resize: "vertical",
              background: "#0f0f0f",
              color: "#ccff00",
              caretColor: "#ccff00",
              outline: "none",
            }}
          />
        </div>

        <button
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem 3rem",
            borderRadius: 12,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: "1.7rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            background: loading
              ? "#333"
              : "linear-gradient(135deg, #ccff00, #39ff14)",
            color: "#000",
            opacity: loading ? 0.7 : 1,
            letterSpacing: "0.5px",
            transition: "opacity 0.2s ease, transform 0.15s ease",
            width: "50%",
            display: "block",
            margin: "1.5rem auto 0",
            outline: "none",
          }}
          onClick={handleAnalyze}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.transform = "translateY(-10px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        <hr style={{ margin: "2rem 0" }} />

        {/* TABS */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #444",
          justifyContent: "center"
        }}>
          <button
            onClick={() => setActiveTab("key_sections")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "key_sections" ? "2px solid #c7ff00" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 600,
              fontSize: "1rem",
              color: activeTab === "key_sections" ? "#c7ff00" : "#aaa",
              transition: "all 0.2s ease",
            }}
          >
            Key Sections
          </button>
          <button
            onClick={() => setActiveTab("relevance")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "relevance" ? "2px solid #c7ff00" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 600,
              fontSize: "1rem",
              color: activeTab === "relevance" ? "#c7ff00" : "#aaa",
              transition: "all 0.2s ease",
            }}
          >
            Relevance Score
          </button>
          <button
            onClick={() => setActiveTab("related_papers")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "related_papers" ? "2px solid #c7ff00" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 600,
              fontSize: "1rem",
              color: activeTab === "related_papers" ? "#c7ff00" : "#aaa",
              transition: "all 0.2s ease",
            }}
          >
            Related Papers
          </button>
          <button
            onClick={() => setActiveTab("research_query")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "research_query" ? "2px solid #c7ff00" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 600,
              fontSize: "1rem",
              color: activeTab === "research_query" ? "#c7ff00" : "#aaa",
              transition: "all 0.2s ease",
            }}
          >
            Research Query
          </button>
        </div>

        {/* TAB CONTENT */}
        {error && <p style={{ color: "red", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{error}</p>}

        {activeTab === "relevance" && (
          <div>
            {!similarity && (
              <p style={{ marginTop: 0, opacity: 0.8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                Enter a research prompt and analyze a paper to see relevance scores.
              </p>
            )}
            {similarity && (
              <>
                <AbstractScoreGauge score={similarity.abstract_score} abstractText={similarity.abstract_text} />
                <ChunkBarChart chunks={similarity.top_chunks} />
              </>
            )}
          </div>
        )}

        {activeTab === "key_sections" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}>
            <ShellFieldDisplay label="title" value={response?.title || null} />
            <ShellFieldDisplay label="task_type" value={response?.task_type || null} />
            <ShellFieldDisplay label="problem_statement" value={response?.problem_statement || null} />
            <ShellFieldDisplay label="core_contribution" value={response?.core_contribution || null} />
            <ShellFieldDisplay label="model_architecture" value={response?.model_architecture || null} />
            <ShellFieldDisplay label="training_details" value={response?.training_details || null} />
            <ShellFieldDisplay label="key_results" value={response?.key_results || null} />
            <ShellFieldDisplay label="limitations" value={response?.limitations || null} />
            <ShellFieldDisplay
              label="datasets"
              value={response?.datasets.length ? response.datasets.join(", ") : null}
            />
            <ShellFieldDisplay
              label="evaluation_metrics"
              value={response?.evaluation_metrics.length ? response.evaluation_metrics.join(", ") : null}
            />
            <ShellFieldDisplay
              label="baselines"
              value={response?.baselines.length ? response.baselines.join(", ") : null}
            />
            <ShellFieldDisplay
              label="application_domains"
              value={response?.application_domains.join(", ") || null}
            />
          </div>
        )}

        {activeTab === "related_papers" && (
          <div>
            {!relatedPapers && (
              <p style={{ marginTop: 0, opacity: 0.8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                Enter a research prompt and analyze a paper to see related arXiv papers.
              </p>
            )}
            {relatedPapers && relatedPapers.length > 0 && (
              <RelatedPapersChart papers={relatedPapers} />
            )}
            {relatedPapers && relatedPapers.length === 0 && (
              <p style={{ marginTop: 0, opacity: 0.8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                No related papers found.
              </p>
            )}
          </div>
        )}

        {activeTab === "research_query" && (
          <div>
            <ChatPanel arxivId={arxivInput} />
          </div>
        )}
      </div>
    </>
  );
}