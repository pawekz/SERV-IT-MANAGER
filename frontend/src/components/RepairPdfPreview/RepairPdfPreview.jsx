import React, { useState, useRef } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PdfDocument from "../PdfDocument/PdfDocument.jsx";
import Toast from "../../components/Toast/Toast.jsx";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../LoadingModal/LoadingModal.jsx";

function dataURLtoBlob(dataURL) {
    const [header, base64] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = Array.from(binary, (char) => char.charCodeAt(0));
    return new Blob([new Uint8Array(array)], { type: mime });
}

const RepairPdfPreview = ({ signatureDataURL, formData, onBack, success, setSuccess, kind }) => {
    const [loading, setLoading] = useState(false);
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [showDialog, setShowDialog] = useState(false);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const navigate = useNavigate();
    const pdfGeneratedRef = useRef(false);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
    };
    const closeToast = () => setToast({ ...toast, show: false });

    React.useEffect(() => {
        let isMounted = true;
        const generatePdf = async () => {
            if (!pdfGeneratedRef.current) {
                const blob = await pdf(
                    <PdfDocument signatureDataURL={signatureDataURL} formData={formData} kind={kind} />
                ).toBlob();
                if (isMounted) {
                    setPdfBlob(blob);
                    setPdfUrl(URL.createObjectURL(blob));
                    pdfGeneratedRef.current = true;
                }
            }
        };
        generatePdf();
        return () => {
            isMounted = false;
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
        // eslint-disable-next-line
    }, [signatureDataURL, formData, kind]);

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
        navigate("/warranty");
    };


    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        if (kind === "repair") {
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

                const ticketNumber = result && result.ticketNumber ? result.ticketNumber : formData.ticketNumber;
                if (ticketNumber && pdfBlob) {
                    const pdfForm = new FormData();
                    pdfForm.append("file", pdfBlob, `${ticketNumber}.pdf`);
                    const pdfResponse = await fetch(
                        `http://localhost:8080/repairTicket/uploadRepairTicketPdf/${ticketNumber}`,
                        {
                            method: "PATCH",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            body: pdfForm,
                        }
                    );
                    if (!pdfResponse.ok) {
                        const errorText = await pdfResponse.text();
                        const errorMessage = errorText || `Server returned ${pdfResponse.status}: ${pdfResponse.statusText}`;
                        showToast("PDF upload failed: " + errorMessage, "error");
                        return;
                    }
                }

                showToast("Repair ticket submitted successfully!", "success");
                setTimeout(() => setLoading(false), 500);
            } catch (err) {
                setError(err.message);
                showToast(err.message, "error");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                console.log("Form Data:", userData.email);
                const token = localStorage.getItem("authToken");
                if (!token) throw new Error("Not authenticated. Please log in.");
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
                            form.append("warrantyPhotosUrls", blob, `photo-${index + 1}.png`);
                        }
                    });
                }

                console.log("Form Data:");
                [...form.entries()].forEach(([key, value]) => console.log(key, value));
                const response = await fetch("http://localhost:8080/warranty/updateWarrantyStatus", {
                    method: "PATCH",
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

                const warrantyNumber = result && result.warrantyNumber ? result.warrantyNumber : formData.warrantyNumber;
                if (warrantyNumber && pdfBlob) {
                    const pdfForm = new FormData();
                    pdfForm.append("file", pdfBlob, `${warrantyNumber}.pdf`);
                    const pdfResponse = await fetch(
                        `http://localhost:8080/warranty/uploadWarrantyDocument/${warrantyNumber}`,
                        {
                            method: "PATCH",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            body: pdfForm,
                        }
                    );
                    if (!pdfResponse.ok) {
                        const errorText = await pdfResponse.text();
                        const errorMessage = errorText || `Server returned ${pdfResponse.status}: ${pdfResponse.statusText}`;
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
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">
                        <span className="text-gray-800">IO</span>
                        <span className="text-[#33e407]">CONNECT</span>
                    </h1>
                </div>
                <div className="max-h-[720px] overflow-y-auto p-4">
                    {pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            width="100%"
                            height="600px"
                            title="PDF Preview"
                            style={{ border: "none" }}
                        />
                    )}
                </div>
                <div className="flex justify-between mt-6">
                    <button
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md focus:outline-none"
                        onClick={onBack}
                        disabled={loading}
                    >
                        Back
                    </button>
                    {/*<a*/}
                    {/*    href={pdfUrl || "#"}*/}
                    {/*    download={*/}
                    {/*        (kind === "repair"*/}
                    {/*            ? (formData.ticketNumber || "repair_ticket")*/}
                    {/*            : (formData.warrantyNumber || "warranty_ticket")) + ".pdf"*/}
                    {/*    }*/}
                    {/*    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"*/}
                    {/*    style={{ display: pdfUrl ? "inline-block" : "none" }}*/}
                    {/*>*/}
                    {/*    Download PDF*/}
                    {/*</a>*/}
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
                        <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">Repair Ticket Checked In</h2>
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
                    message="Please wait while we submit the repair ticket..."
                />
            )}
        </div>
    );
};

export default RepairPdfPreview;