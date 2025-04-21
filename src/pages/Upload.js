import React, { useState } from "react";
import { storage } from "../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import promptLibrary from "../promptLibrary.json";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [fileLabels, setFileLabels] = useState([]);
  const [downloadURLs, setDownloadURLs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiResponse, setAIResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const labels = await Promise.all(
      selectedFiles.map(async (file) => {
        const label = prompt(`Enter a name for: ${file.name}`);
        return label || file.name;
      })
    );
    setFiles(selectedFiles);
    setFileLabels(labels);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const urls = [];

    const uploadTasks = files.map((file, i) => {
      const storageRef = ref(storage, `pdfs/${file.name}`);
      return uploadBytes(storageRef, file).then(async (snapshot) => {
        const url = await getDownloadURL(snapshot.ref);
        urls.push({ url, label: fileLabels[i] });
      });
    });

    try {
      await Promise.all(uploadTasks);
      setDownloadURLs(urls);
      setUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      alert("Error uploading files. Please try again.");
    }
  };

  const handleRunAI = async () => {
    const promptToUse = customPrompt || selectedPrompt;
    if (!promptToUse || downloadURLs.length === 0) return;

    setLoading(true);
    setError(null);
    setAIResponse("");

    try {
      const res = await fetch("https://steeldocs-ai.onrender.com/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptToUse,
          pdfUrl: downloadURLs[activeIndex].url,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setAIResponse(data.result);
      } else {
        setError("No result returned.");
      }
    } catch (error) {
      console.error("AI error:", error);
      setError("Error processing prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-5">
      <h2 className="text-center mb-4">Upload & View PDFs</h2>
      <div className="d-flex justify-content-center mb-3">
        <input
          type="file"
          accept="application/pdf"
          className="form-control w-75 me-2"
          onChange={handleFileChange}
          multiple
        />
        <button
          className="btn btn-primary w-25"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      {downloadURLs.length > 0 && (
        <div className="mt-4">
          <div className="mb-3">
            {downloadURLs.map((file, index) => (
              <button
                key={index}
                className={`btn btn-outline-primary me-2 mb-2 ${
                  index === activeIndex ? "active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                {file.label}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label>Select AI Prompt:</label>
            <select
              className="form-select mb-2"
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
            >
              <option value="">-- Choose a prompt --</option>
              {promptLibrary.map((prompt) => (
                <option key={prompt.id} value={prompt.defaultPrompt}>
                  {prompt.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="form-control mb-2"
              placeholder="What would you like to ask?"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />

            <button className="btn btn-success mt-1" onClick={handleRunAI}>
              Run AI
            </button>
          </div>

          {loading && <div className="alert alert-warning mt-3">Running AI...</div>}
          {aiResponse && (
            <div className="alert alert-info mt-4">
              <h5>AI Response:</h5>
              <pre>{aiResponse}</pre>
            </div>
          )}
          {error && (
            <div className="alert alert-danger mt-3">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="pdf-wrapper mt-3">
            <h5>{downloadURLs[activeIndex].label}</h5>
            <div style={{ height: "800px" }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={downloadURLs[activeIndex].url}
                  plugins={[defaultLayoutPluginInstance]}
                />
              </Worker>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
