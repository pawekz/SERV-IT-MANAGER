import { useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PdfDocument from "../PdfDocument/PdfDocument.jsx";
import Toast from "../../components/Toast/Toast.jsx";

function dataURLtoBlob(dataURL) {
    const [header, base64] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = Array.from(binary, (char) => char.charCodeAt(0));
    return new Blob([new Uint8Array(array)], { type: mime });
}

const RepairPdfPreview = ({ signatureDataURL, formData, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
    };
    const closeToast = () => setToast({ ...toast, show: false });

    const uploadPdf = async (ticketNumber) => {
        try {
            const pdfBlob = await pdf(
                <PdfDocument signatureDataURL={signatureDataURL} formData={formData} />
            ).toBlob();

            const form = new FormData();
            form.append("file", pdfBlob, `${ticketNumber}.pdf`);

            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `http://localhost:8080/repairTicket/uploadRepairTicketDocument/${ticketNumber}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: form,
                }
            );
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.text();
                    errorMessage = errorData || `Server returned ${response.status}: ${response.statusText}`;
                } catch (e) {
                    errorMessage = `Server returned ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            showToast("Repair ticket submitted successfully!", "success");

        } catch (err) {
            showToast("PDF upload failed: " + err.message, "error");
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Not authenticated. Please log in.");
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== "repairPhotos" && key !== "digitalSignature" && value != null)
                    form.append(key, value.toString());
            });
            if (signatureDataURL) {
                const signatureBlob = dataURLtoBlob(signatureDataURL);
                form.append("digitalSignature", signatureBlob, "signature.png");
            } else {
                throw new Error("Digital signature is required");
            }
            if (formData.repairPhotos && Array.isArray(formData.repairPhotos)) {
                formData.repairPhotos.slice(0, 3).forEach((base64DataURL, index) => {
                    if (base64DataURL) {
                        const blob = dataURLtoBlob(base64DataURL);
                        form.append("repairPhotos", blob, `photo-${index + 1}.png`);
                    }
                });
            }
            const response = await fetch("http://localhost:8080/repairTicket/checkInRepairTicket", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.text();
                    errorMessage = errorData || `Server returned ${response.status}: ${response.statusText}`;
                } catch (e) {
                    errorMessage = `Server returned ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            setSuccess(result);

            if (result && result.ticketNumber) {
                await uploadPdf(result.ticketNumber);
            } else if (formData.ticketNumber) {
                await uploadPdf(formData.ticketNumber);
            }
        } catch (err) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex justify-center py-8">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
                <div className="max-h-[720px] overflow-y-auto p-4">
                    <PDFViewer width="100%" height="600px">
                        <PdfDocument signatureDataURL={signatureDataURL} formData={formData} />
                    </PDFViewer>
                </div>
                <div className="flex justify-between mt-6">
                    <button
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md focus:outline-none"
                        onClick={onBack}
                        disabled={loading}
                    >
                        Back
                    </button>
                    <button
                        className="px-6 py-2 bg-[#33e407] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                        onClick={handleSubmit}
                        disabled={loading || success}
                    >
                        {success ? "Submitted" : "Submit"}
                    </button>
                </div>
            </div>
            {/* Toast Notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />
        </div>
    );
};

export default RepairPdfPreview;