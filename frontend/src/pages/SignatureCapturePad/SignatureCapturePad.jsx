import { useRef, useState, useEffect } from "react";
import PdfDocument from "../../components/PdfDocument/PdfDocument.jsx";
import { PDFViewer } from "@react-pdf/renderer";
import TermsEditor from "../TermsEditor/TermsEditor.jsx";
import { ArrowLeft, ArrowRight, Home, X } from "lucide-react";

// --- Utility Functions ---
function dataURLtoBlob(dataURL) {
    const [header, base64] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = Array.from(binary, (char) => char.charCodeAt(0));
    return new Blob([new Uint8Array(array)], { type: mime });
}

// --- Main Component ---
const SignatureCapturePad = ({ onBack, formData, onDashboard, onSubmit }) => {
    // --- State ---
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [signatureDataURL, setSignatureDataURL] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleBack = () => {
        onBack()
    }

    // --- Signature Pad Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setContext(ctx);

        const handleResize = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.fillStyle = "#fafafa";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#000000";
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getCoordinates = (e) => {
        if (e.type.includes("touch")) {
            const rect = canvasRef.current.getBoundingClientRect();
            const touch = e.touches[0] || e.changedTouches[0];
            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top,
            };
        } else {
            return {
                offsetX: e.nativeEvent.offsetX,
                offsetY: e.nativeEvent.offsetY,
            };
        }
    };

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        context.beginPath();
        context.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        setIsEmpty(false);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        context.lineTo(offsetX, offsetY);
        context.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            context.closePath();
            setIsDrawing(false);
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        context.fillStyle = "#fafafa";
        context.fillRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    // --- Form Validation & Submission ---
    const validateFormData = (data = formData) => {
        const requiredFields = [
            "ticketNumber", "customerName", "customerEmail", "customerPhoneNumber", "deviceColor",
            "deviceType", "deviceBrand", "deviceModel", "reportedIssue", "accessories",
        ];
        const missingFields = requiredFields.filter(
            (field) => !data[field] || data[field].trim() === ""
        );
        if (missingFields.length > 0) return `Missing required fields: ${missingFields.join(", ")}`;
        return null;
    };

    const handleNext = async () => {
        if (isEmpty) {
            alert("Please provide a signature before proceeding.");
            return;
        }
        if (!termsAccepted) {
            alert("You must accept the terms and conditions before proceeding.");
            return;
        }
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL("image/png");
        setSignatureDataURL(dataUrl);
        const validationError = validateFormData({ ...formData, signatureDataURL: dataUrl });
        if (validationError) {
            alert(validationError);
            return;
        }
        if (onSubmit) {
            onSubmit(dataUrl);
        }
    };

    return (
        <div className="w-full flex flex-row items-start justify-center py-8 gap-8 px-4 max-w-[1000px] mx-auto">
            {/* Signature Panel */}
            <div className="flex flex-col items-center max-w-2xl w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden min-w-[500px]">
                <div className="flex w-full">
                    <div className="w-1 bg-[#33e407]"></div>
                    <div className="flex-1 p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold">
                                <span className="text-gray-800">IO</span>
                                <span className="text-[#33e407]">CONNECT</span>
                            </h1>
                            <h2 className="text-xl font-semibold text-gray-800 mt-4">Digital Signature</h2>
                            <p className="text-gray-600 mt-1">Sign using mouse, touch, or stylus</p>
                        </div>
                        <p className="text-center text-gray-600 mb-4">
                            Please sign in the box below to complete your claim form
                        </p>
                        <div className="flex-1 max-w-3xl">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-64 cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            ></canvas>
                        </div>
                        {/* Terms Checkbox */}
                        <label className="flex items-center justify-between my-4 w-full">
                            <span className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-green-500"
                                />
                                <span className="text-gray-700 font-semibold">
                                    I accept the{" "}
                                    <button
                                        type="button"
                                        className="underline text-[#33e407] hover:text-[#2dc406] focus:outline-none"
                                        onClick={() => setShowTermsModal(true)}
                                    >
                                        terms and conditions
                                    </button>
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={clearSignature}
                                className="text-gray-500 hover:text-red-500 underline ml-4"
                                style={{ fontWeight: 500 }}
                            >
                                Clear
                            </button>
                        </label>
                        {/* Signature Controls */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex w-full justify-between mt-4">
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-[#33e407] hover:bg-[#2dc406] text-white rounded-md transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-gray-500 text-sm mt-6">
                            By signing, you confirm that all information provided is accurate and complete.
                        </p>
                    </div>
                </div>
            </div>
            {showTermsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                    onClick={() => setShowTermsModal(false)} // Close on overlay click
                >
                    <div
                        className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-12 relative animate-scaleIn"
                        style={{ animation: "scaleIn 0.2s cubic-bezier(0.4,0,0.2,1)", maxWidth: "1100px"}}
                        onClick={e => e.stopPropagation()} // Prevent close when clicking inside modal
                    >
                        <button
                            className="absolute top-2 right-2 text-gray-700 hover:text-red-500 focus:outline-none"
                            onClick={() => setShowTermsModal(false)}
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                        <div className="max-h-[65vh] overflow-y-auto border border-gray-200 rounded-md p-4">
                            <TermsEditor />
                        </div>
                    </div>
                    <style>
                        {`
                            [...]
                        `}
                    </style>
                </div>
            )}
        </div>
    );
};

export default SignatureCapturePad;