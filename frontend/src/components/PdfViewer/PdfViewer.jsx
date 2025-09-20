import React from "react";

const PdfViewer = ({ fileUrl, height = "600px" }) => (
    <div style={{ height, width: "100%" }}>
        {fileUrl ? (
            <iframe
                src={fileUrl}
                title="PDF Viewer"
                width="100%"
                height={height}
                style={{ border: "none" }}
                sandbox="allow-same-origin allow-scripts"
            />
        ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
                PDF preview will appear here
            </div>
        )}
    </div>
);

export default PdfViewer;
