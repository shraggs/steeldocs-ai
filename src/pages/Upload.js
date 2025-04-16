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
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [aiResponse, setAIResponse] = useState("");

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
    if (!selectedPrompt || downloadURLs.length === 0) return;

    try {
      const res = await fetch("https://your-cloud-server-url.com/api/callai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: selectedPrompt,
          pdfUrl: downloadURLs[activeIndex].url,
        }),
      });

      const data = await res.json();
      setAIResponse(data.result);
    } catch (error) {
      console.error("AI error:", error);
      alert("Error processing prompt.");
    }
  };

  return (
    <div className="container mt-5">
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
              className="form-select"
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
            <button className="btn btn-success mt-2" onClick={handleRunAI}>
              Run AI
            </button>
          </div>

          <div className="pdf-preview">
            <h5>{downloadURLs[activeIndex].label}</h5>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer
                fileUrl={downloadURLs[activeIndex].url}
                plugins={[defaultLayoutPluginInstance]}
              />
            </Worker>
          </div>

          {aiResponse && (
            <div className="alert alert-info mt-4">
              <h5>AI Response:</h5>
              <pre>{aiResponse}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
