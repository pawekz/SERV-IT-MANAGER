import React from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const PdfViewer = ({ fileUrl, height = "600px" }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    return (
        <div style={{ height, width: "100%" }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                {fileUrl ? (
                    <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        PDF preview will appear here
                    </div>
                )}
            </Worker>
        </div>
    );
};

export default PdfViewer;

