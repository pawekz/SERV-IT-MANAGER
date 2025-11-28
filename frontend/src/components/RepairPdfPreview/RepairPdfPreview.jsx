import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import PdfDocument from "../PdfDocument/PdfDocument.jsx";
import Toast from "../../components/Toast/Toast.jsx";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../LoadingModal/LoadingModal.jsx";
import api from '../../config/ApiConfig';
import PdfViewer from "../PdfViewer/PdfViewer.jsx";

function dataURLtoBlob(dataURL) {
    if (!dataURL || typeof dataURL !== 'string') {
        throw new Error('Invalid dataURL: must be a non-empty string');
    }
    
    const parts = dataURL.split(',');
    if (parts.length !== 2) {
        throw new Error('Invalid dataURL format: expected "data:[mediatype];base64,<data>"');
    }
    
    const header = parts[0];
    const base64 = parts[1];
    
    let mime = 'image/jpeg';
    if (header.includes(':')) {
        const mimeMatch = header.match(/:(.*?);/);
        if (mimeMatch && mimeMatch[1]) {
            mime = mimeMatch[1];
        }
    }
    
    if (!base64 || base64.trim().length === 0) {
        throw new Error('Invalid dataURL: base64 data is empty');
    }
    
    try {
        const binary = atob(base64);
        const array = Array.from(binary, (char) => char.charCodeAt(0));
        const blob = new Blob([new Uint8Array(array)], { type: mime });
        
        if (blob.size === 0) {
            throw new Error('Invalid dataURL: resulting blob is empty');
        }
        
        return blob;
    } catch (error) {
        throw new Error(`Failed to convert dataURL to blob: ${error.message}`);
    }
}

const RepairPdfPreview = ({ signatureDataURL, formData, onBack, success, setSuccess, kind }) => {
    const [loading, setLoading] = useState(false);
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const [error, setError] = useState(null); // keep and display
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [showDialog, setShowDialog] = useState(false);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const navigate = useNavigate();
    const userRole = (localStorage.getItem('userRole') || '').toUpperCase();

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
    };
    const closeToast = () => setToast({ ...toast, show: false });

    React.useEffect(() => {
        let isMounted = true;

        const generatePdf = async () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
            const blob = await pdf(
                <PdfDocument signatureDataURL={signatureDataURL} formData={formData} kind={kind} />
            ).toBlob();
            if (isMounted) {
                setPdfBlob(blob);
                setPdfUrl(URL.createObjectURL(blob));
            }
        };

        generatePdf();

        return () => {
            isMounted = false;
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, []);

    const handleFinishClick = () => {
        setShowDialog(true);
    };

    const handleSubmitAnother = () => {
        setShowDialog(false);
        setSuccess(null);
        window.location.href = "/newRepair";
    };

    const handleGoDashboard = () => {
        setShowDialog(false);
        navigate("/dashboard");
    };

    const handleGoBack = () => {
        setShowDialog(false);
        setSuccess(true);
        navigate("/warranty");
    };


    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        if (kind === "repair") {
            try {
                const form = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    if (key !== "repairPhotos" && key !== "digitalSignature" && value != null)
                        form.append(key, value.toString());
                });
                if (signatureDataURL) {
                    const signatureBlob = dataURLtoBlob(signatureDataURL);
                    form.append("digitalSignature", signatureBlob, "signature.jpg");
                } else {
                    setError("Digital signature is required");
                    showToast("Digital signature is required", "error");
                    setLoading(false);
                    return;
                }
                if (formData.repairPhotos && Array.isArray(formData.repairPhotos)) {
                    const validPhotos = formData.repairPhotos
                        .slice(0, 3)
                        .filter(photo => photo && typeof photo === 'string' && photo.trim().length > 0);
                    
                    if (validPhotos.length === 0) {
                        setError("At least one repair photo is required");
                        showToast("At least one repair photo is required", "error");
                        setLoading(false);
                        return;
                    }
                    
                    validPhotos.forEach((base64DataURL, index) => {
                        try {
                            const blob = dataURLtoBlob(base64DataURL);
                            
                            // Determine file extension from MIME type
                            let extension = '.jpg';
                            if (base64DataURL.includes('data:image/png')) {
                                extension = '.png';
                            } else if (base64DataURL.includes('data:image/jpeg') || base64DataURL.includes('data:image/jpg')) {
                                extension = '.jpg';
                            }
                            
                            const timestamp = Date.now();
                            const filename = `repair-photo-${timestamp}-${index + 1}${extension}`;
                            
                            form.append("repairPhotos", blob, filename);
                        } catch (error) {
                            console.error(`Failed to process photo ${index + 1}:`, error);
                            setError(`Failed to process photo ${index + 1}: ${error.message}`);
                            showToast(`Failed to process photo ${index + 1}`, "error");
                            setLoading(false);
                            return;
                        }
                    });
                } else {
                    setError("Repair photos are required");
                    showToast("Repair photos are required", "error");
                    setLoading(false);
                    return;
                }

                const response = await api.post('/repairTicket/checkInRepairTicket', form);
                const result = response.data;
                setSuccess(result);

                const ticketNumber = result && result.ticketNumber ? result.ticketNumber : formData.ticketNumber;

                if (userRole === 'ADMIN' && formData.technicianEmail && ticketNumber) {
                    try {
                        await api.patch('/user/assignTechnician', {
                            ticketNumber: ticketNumber,
                            technicianEmail: formData.technicianEmail
                        });
                    } catch (assignErr) {
                        showToast(`Technician assignment failed: ${assignErr?.response?.data || assignErr.message}`, 'error');
                    }
                }

                if (ticketNumber && pdfBlob) {
                    const pdfForm = new FormData();
                    pdfForm.append("file", pdfBlob, `${ticketNumber}.pdf`);
                    const pdfResponse = await api.patch(`/repairTicket/uploadRepairTicketPdf/${ticketNumber}`, pdfForm);
                    if (pdfResponse.status < 200 || pdfResponse.status >= 300) {
                        const errorMessage = `Server returned ${pdfResponse.status}: ${pdfResponse.statusText}`;
                        showToast("PDF upload failed: " + errorMessage, "error");
                        return;
                    }
                }

                showToast(kind === "repair" ? "Repair ticket submitted successfully!" : "Warranty ticket submitted successfully!", "success");
                setTimeout(() => setLoading(false), 500);
            } catch (err) {
                setError(err.message);
                showToast(err.message, "error");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const form = new FormData();
                if (formData.warrantyNumber) {
                    form.append("warrantyNumber", formData.warrantyNumber.toString());
                }
                if (formData.status) {
                    form.append("status", formData.status.toString());
                }
                if (userData.email) {
                    form.append("technicianEmail", userData.email.toString());
                }
                if (formData.returnReason) {
                    form.append("returnReason", formData.returnReason.toString());
                }
                if (formData.color) {
                    form.append("color", formData.color.toString());
                }
                if (formData.password) {
                    form.append("password", formData.password.toString());
                }
                if (formData.accessories) {
                    form.append("accessories", formData.accessories.toString());
                }
                if (formData.type) {
                    form.append("deviceType", formData.type.toString());
                }
                if (formData.techObservation) {
                    form.append("techObservation", formData.techObservation.toString());
                }
                if (formData.warrantyPhotosUrls && Array.isArray(formData.warrantyPhotosUrls)) {
                    formData.warrantyPhotosUrls.slice(0, 3).forEach((base64DataURL, index) => {
                        if (base64DataURL) {
                            const blob = dataURLtoBlob(base64DataURL);
                            form.append("warrantyPhotosUrls", blob, `photo-${index + 1}.jpg`);
                        }
                    });
                }
                const response = await api.patch('/warranty/updateWarrantyStatus', form);
                const result = response.data;
                setSuccess(result);

                const warrantyNumber = result && result.warrantyNumber ? result.warrantyNumber : formData.warrantyNumber;
                if (warrantyNumber && pdfBlob) {
                    const pdfForm = new FormData();
                    pdfForm.append("file", pdfBlob, `${warrantyNumber}.pdf`);
                    const pdfResponse = await api.patch(`/warranty/uploadWarrantyDocument/${warrantyNumber}`, pdfForm);
                    if (pdfResponse.status < 200 || pdfResponse.status >= 300) {
                        const errorMessage = `Server returned ${pdfResponse.status}: ${pdfResponse.statusText}`;
                        showToast("PDF upload failed: " + errorMessage, "error");
                        return;
                    }
                }

                showToast("Warranty ticket submitted successfully!", "success");
                setTimeout(() => setLoading(false), 500);
            } catch (err) {
                setError(err.message);
                showToast(err.message, "error");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="w-full flex justify-center py-8">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
                {error && (
                    <div className="mb-4 p-3 text-sm rounded bg-red-100 text-red-700 border border-red-200">{error}</div>
                )}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">
                        <span className="text-gray-800">IO</span>
                        <span className="text-[#33e407]">CONNECT</span>
                    </h1>
                </div>
                <div className="max-h-[720px] overflow-y-auto p-4">
                    <PdfViewer fileUrl={pdfUrl} height="600px" />
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
                        className="px-6 py-2 bg-[#25D482] hover:bg-[#1fab6b] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                        onClick={success ? handleFinishClick : handleSubmit}
                        disabled={loading}
                    >
                        {success ? (loading ? "Processing..." : "Done") : (loading ? "Submitting..." : "Submit")}
                    </button>
                </div>
            </div>
            {showDialog ? (
                kind === "repair" ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full relative animate-fadeIn border border-gray-100">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#25D482">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">
                            {kind === "repair" ? "Repair Ticket Checked In" : "Warranty Ticket Checked In"}
                        </h2>
                        <p className="text-center text-gray-500 mb-6 text-sm">What would you like to do next?</p>
                        <div className="flex flex-col gap-2">
                            <button
                                className="w-full px-5 py-2 bg-[#25D482] hover:bg-[#2bc106] text-white rounded-lg font-medium transition"
                                onClick={handleSubmitAnother}
                            >
                                Submit Another Ticket
                            </button>
                            <button
                                className="w-full px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                                onClick={handleGoDashboard}
                            >
                                Return to Dashboard
                            </button>
                        </div>
                        <button
                            className="mt-4 w-full text-gray-400 hover:text-red-500 text-xs underline transition"
                            onClick={() => setShowDialog(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition"
                            onClick={() => setShowDialog(false)}
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; transform: scale(0.97);}
                                to { opacity: 1; transform: scale(1);}
                            }
                            .animate-fadeIn {
                                animation: fadeIn 0.18s cubic-bezier(0.4,0,0.2,1);
                            }
                        `}</style>
                    </div>
                </div>
            ): kind === "warranty" ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full relative animate-fadeIn border border-gray-100">
                <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#25D482">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                </div>
                </div>
                    <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">Warranty Checked In</h2>
                    <p className="text-center text-gray-500 mb-6 text-sm">Please bring the device to the store to proceed.</p>
                    <button
                        className="w-full px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                        onClick={handleGoBack}
                    >
                        Done
                    </button>
                    <button
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition"
                        onClick={() => setShowDialog(false)}
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <style>{`
                                            @keyframes fadeIn {
                                                from { opacity: 0; transform: scale(0.97);}
                                                to { opacity: 1; transform: scale(1);}
                                            }
                                            .animate-fadeIn {
                                                animation: fadeIn 0.18s cubic-bezier(0.4,0,0.2,1);
                                            }
                                        `}</style>
                </div>
                </div>
                ) : null
            ) : null}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />
            {loading && (
                <LoadingModal
                    show={loading}
                    title="Processing"
                    message={kind === "warranty"
                        ? "Please wait while we submit the warranty ticket..."
                        : "Please wait while we submit the repair ticket..."
                    }
                />
            )}
        </div>
    );
};

export default RepairPdfPreview;
