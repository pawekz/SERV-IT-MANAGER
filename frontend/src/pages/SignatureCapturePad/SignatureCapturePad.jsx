import { useRef, useState, useEffect } from "react"
import PdfDocument from "../../components/PdfDocument/PdfDocument.jsx"
import { PDFViewer } from '@react-pdf/renderer'
import TermsEditor from "../TermsEditor/TermsEditor.jsx"

const SignatureCapturePad = ({ onBack, formData }) => {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [context, setContext] = useState(null)
    const [isEmpty, setIsEmpty] = useState(true)
    const [signatureDataURL, setSignatureDataURL] = useState(null)
    const [showPDF, setShowPDF] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const handleBack = () => {
        onBack()
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.strokeStyle = "#000000"

        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        ctx.fillStyle = "#fafafa"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        setContext(ctx)

        const handleResize = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            ctx.fillStyle = "#fafafa"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.putImageData(imageData, 0, 0)
            ctx.lineWidth = 2
            ctx.lineCap = "round"
            ctx.strokeStyle = "#000000"
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e)
        context.beginPath()
        context.moveTo(offsetX, offsetY)
        setIsDrawing(true)
        setIsEmpty(false)
    }

    const draw = (e) => {
        if (!isDrawing) return

        const { offsetX, offsetY } = getCoordinates(e)
        context.lineTo(offsetX, offsetY)
        context.stroke()
    }

    const stopDrawing = () => {
        if (isDrawing) {
            context.closePath()
            setIsDrawing(false)
        }
    }

    const getCoordinates = (e) => {
        if (e.type.includes("touch")) {
            const rect = canvasRef.current.getBoundingClientRect()
            const touch = e.touches[0] || e.changedTouches[0]
            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top,
            }
        } else {
            return {
                offsetX: e.nativeEvent.offsetX,
                offsetY: e.nativeEvent.offsetY,
            }
        }
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        context.fillStyle = "#fafafa"
        context.fillRect(0, 0, canvas.width, canvas.height)
        setIsEmpty(true)
    }

    const saveSignature = () => {
        if (isEmpty) {
            alert("Please provide a signature before saving.")
            return
        }

        const canvas = canvasRef.current
        const dataUrl = canvas.toDataURL("image/png")
        setSignatureDataURL(dataUrl)
    }

    function dataURLtoBlob(dataURL) {
        const [header, base64] = dataURL.split(',')
        const mime = header.match(/:(.*?);/)[1]
        const binary = atob(base64)
        const array = Array.from(binary, (char) => char.charCodeAt(0))
        return new Blob([new Uint8Array(array)], { type: mime })
    }

    const validateFormData = (data = formData) => {
        const requiredFields = [
            'ticketNumber', 'customerName', 'customerEmail', 'customerPhoneNumber', 'deviceColor',
            'deviceType', 'deviceBrand', 'deviceModel', 'reportedIssue', 'accessories',
        ];

        const missingFields = requiredFields.filter(field =>
            !data[field] || data[field].trim() === ''
        );

        if (missingFields.length > 0) {
            return `Missing required fields: ${missingFields.join(', ')}`;
        }

        if (!data.signatureDataURL) {
            return 'Digital signature is required';
        }

        return null;
    };

    const submitRepairTicket = async (sigDataUrl = signatureDataURL) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error("Not authenticated. Please log in.");
        }

        const form = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'repairPhotos' && key !== 'digitalSignature' && value !== null && value !== undefined) {
                form.append(key, value.toString());
            }
        });

        const signatureToUse = sigDataUrl || signatureDataURL;
        if (signatureToUse) {
            const signatureBlob = dataURLtoBlob(signatureToUse);
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

        try {
            const response = await fetch("http://localhost:8080/repairTicket/checkInRepairTicket", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: form
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
            alert("Repair ticket submitted successfully!");
            return result;
        } catch (error) {
            throw error;
        }
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

        // Save signature and get the dataURL synchronously
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL("image/png");
        setSignatureDataURL(dataUrl);

        // Use the freshly captured dataUrl for validation and submission
        const validationError = validateFormData({ ...formData, signatureDataURL: dataUrl });
        if (validationError) {
            alert(validationError);
            return;
        }

        setShowPDF(true);

        try {
            await submitRepairTicket(dataUrl);
        } catch (error) {
            alert("Failed to submit the form. Please try again.");
        }
    };

    return (
        <div className="w-full flex flex-row items-start justify-center py-8 gap-8 px-4 max-w-[1000px] mx-auto">
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

                        <p className="text-center text-gray-600 mb-4">Please sign in the box below to complete your claim form</p>

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
                            {isEmpty && <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400">Sign here</div>}
                        </div>

                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex space-x-4">
                                <button
                                    onClick={clearSignature}
                                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Clear
                                </button>
                            </div>

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
                                    Submit
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-gray-500 text-sm mt-6">
                            By signing, you confirm that all information provided is accurate and complete.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-[550px] bg-white rounded-lg shadow-lg p-6 sticky top-8">
                {!showPDF ? (
                    <div>
                        <label className="flex items-center space-x-2 mb-4">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="form-checkbox h-5 w-5 text-green-500"
                            />
                            <span className="text-gray-700 font-semibold">I accept the terms and conditions</span>
                        </label>

                        <div className="max-h-[535px] overflow-y-auto border border-gray-200 rounded-md p-4 min-w-[450px]">
                            <TermsEditor />
                        </div>
                        <p className="text-gray-500 text-sm mt-4">
                            Please review the terms and conditions before proceeding.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[610px] overflow-y-auto border border-gray-200 rounded-md p-4 min-w-[500px]">
                        <PDFViewer width="100%" height="600">
                            <PdfDocument signatureDataURL={signatureDataURL} formData={formData} />
                        </PDFViewer>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SignatureCapturePad