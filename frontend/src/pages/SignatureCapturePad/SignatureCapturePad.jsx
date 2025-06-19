import { useRef, useState, useEffect } from "react";
import TermsEditor from "../TermsEditor/TermsEditor.jsx";
import { X } from "lucide-react";
import Toast from "../../components/Toast/Toast.jsx"; // Import Toast

// --- Main Component ---
const SignatureCapturePad = ({
                                 onBack,
                                 formData,
                                 signatureDataURL,
                                 setSignatureDataURL,
                                 termsAccepted,
                                 setTermsAccepted,
                                 onDashboard,
                                 onSubmit,
                                 success = false,
    kind
                             }) => {
    // --- State ---
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!signatureDataURL);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const showToast = (message, type = "success") => setToast({ show: true, message, type });
    const closeToast = () => setToast({ ...toast, show: false });


    // --- Signature Pad Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        setContext(ctx);

        // Draw existing signature if available
        if (signatureDataURL) {
            const img = new window.Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = signatureDataURL;
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const handleResize = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.putImageData(imageData, 0, 0);
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#000000";
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [signatureDataURL]);

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
            const canvas = canvasRef.current;
            const dataUrl = canvas.toDataURL("image/png");
            setSignatureDataURL(dataUrl);
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        setSignatureDataURL(null);
        showToast("Signature cleared.", "success");
    };

    const handleClear = async () => {
        if (!isEmpty) {
            clearSignature();
        }
    };

    // --- Form Validation & Submission ---
    const validateFormData = (data = formData) => {
        let requiredFields = [];

        if (kind === "repair") {
            requiredFields = [
                "ticketNumber", "customerName", "customerEmail", "customerPhoneNumber", "deviceColor",
                "deviceType", "deviceBrand", "deviceModel", "reportedIssue", "accessories",
            ];
        } else {
            requiredFields = [
                "warrantyNumber", "status", "warrantyPhotosUrls"
            ];
        }

        const missingFields = requiredFields.filter((field) => {
            const value = data[field];

            if (value === undefined || value === null) return true;

            if (typeof value === "string") return value.trim() === "";

            if (Array.isArray(value)) return value.length === 0;

            if (typeof value === "object") return Object.keys(value).length === 0;

            return false; // assume number/boolean are valid if defined
        });

        if (missingFields.length > 0) {
            return `Missing required fields: ${missingFields.join(", ")}`;
        }
        return null;
    };

    const handleNext = async () => {
        if (isEmpty && !signatureDataURL) {
            showToast("Please provide a signature before proceeding.", "error");
            return;
        }
        if (!termsAccepted) {
            showToast("You must accept the terms and conditions before proceeding.", "error");
            return;
        }
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL("image/png");
        setSignatureDataURL(dataUrl);
        const validationError = validateFormData({ ...formData, signatureDataURL: dataUrl });
        if (validationError) {
            showToast(validationError, "error");
            return;
        }
        if (onSubmit) {
            onSubmit(dataUrl);
            showToast("Signature captured successfully!", "success");
        }
    };

    return (
        <div className="w-full flex flex-row items-start justify-center py-8 gap-8 px-4 max-w-[1000px] mx-auto">
            {/* Signature Panel */}
            <div className="flex flex-col items-center max-w-2xl w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden min-w-[500px]">
                <div className="flex w-full">
                    <div className="w-1 bg-[#33e407]"></div>
                    <div className="flex-1 p-8">
                        {/* ...header... */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold">
                                <span className="text-gray-800">IO</span>
                                <span className="text-[#33e407]">CONNECT</span>
                            </h1>
                            <h2 className="text-xl font-semibold text-gray-800 mt-4">Digital Signature</h2>
                            <p className="text-gray-600 mt-1">Sign using mouse, touch, or stylus</p>
                        </div>
                        <p className="text-center text-gray-600 mb-4">
                            Please sign in the box below to complete your repair ticket form
                        </p>
                        <div className="flex-1 max-w-3xl">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-64 cursor-crosshair border-2 border-gray-300 rounded-md"
                                onMouseDown={e => !success && startDrawing(e)}
                                onMouseMove={e => !success && draw(e)}
                                onMouseUp={e => !success && stopDrawing(e)}
                                onMouseLeave={e => !success && stopDrawing(e)}
                                onTouchStart={e => !success && startDrawing(e)}
                                onTouchMove={e => !success && draw(e)}
                                onTouchEnd={e => !success && stopDrawing(e)}
                                style={{ background: "#fff", pointerEvents: success ? "none" : "auto" }}
                            ></canvas>
                        </div>
                        <p className="text-center text-gray-500 text-sm mt-6">
                            By signing, you acknowledge that this signature is legally binding and that all information provided is accurate and complete.
                        </p>
                        {/* Terms Checkbox */}
                        <label className="flex items-center justify-between my-4 w-full">
                            <span className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={e => setTermsAccepted(e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-green-500"
                                    disabled={success}
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
                                onClick={handleClear}
                                className="text-gray-500 hover:text-red-500 underline ml-4"
                                style={{ fontWeight: 500 }}
                                disabled={success}
                            >
                                Clear
                            </button>
                        </label>
                        {/* ...controls and modal... */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex w-full justify-between mt-4">
                                <button
                                    onClick={onBack}
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
                    </div>
                </div>
            </div>
            {/* ...modal and toast... */}
            {showTermsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                    onClick={() => setShowTermsModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-10 relative border border-gray-100"
                        style={{ maxWidth: "900px", minHeight: "60vh" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition-colors"
                            onClick={() => setShowTermsModal(false)}
                            aria-label="Close"
                        >
                            <X size={28} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center tracking-tight">
                            Terms & Conditions
                        </h2>
                        <div className="max-h-[60vh] overflow-y-auto border border-gray-100 rounded-lg p-6 bg-gray-50">
                            <TermsEditor />
                        </div>
                    </div>
                </div>
            )}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />
        </div>
    );
};

export default SignatureCapturePad;