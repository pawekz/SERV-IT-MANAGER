import React, {useEffect, useState} from "react";
import WarrantyStepper from "../WarrantyStepper/WarrantyStepper.jsx";
import SignatureCapturePad from "../../pages/SignatureCapturePad/SignatureCapturePad.jsx";
import RepairPdfPreview from "../RepairPdfPreview/RepairPdfPreview.jsx";

const WarrantyReceive = ({ reason = {}, data = {}, OnClose, success, setSuccess }) => {
    if (!data) return null;
    const [formData, setFormData] = useState(data);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [signatureDataURL, setSignatureDataURL] = useState(formData.digitalSignature || "");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [checkInResponse, setCheckInResponse] = useState(null);



    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative bg-white w-full max-w-5xl max-h-[95vh] rounded-lg shadow-lg overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                    onClick={OnClose}
                    className="absolute top-3 right-7 text-gray-600 hover:text-black text-xl font-bold"
                >
                    &times;
                </button>

                {/* Stepper Section */}
                <div className="bg-gray-100 border-b border-gray-200 p-6">
                    <WarrantyStepper step={data.status} />
                </div>

                {/* Signature Pad */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!showPdfPreview ? (
                        <SignatureCapturePad
                            formData={formData}
                            setSignatureDataURL={(dataUrl) =>
                                setFormData(prev => ({ ...prev, digitalSignature: dataUrl }))
                            }
                            signatureDataURL={formData.digitalSignature}
                            termsAccepted={termsAccepted}
                            setTermsAccepted={setTermsAccepted}
                            onSubmit={(dataUrl) => {
                                setFormData(prev => ({ ...prev, digitalSignature: dataUrl }));
                                setSignatureDataURL(dataUrl);
                                setShowPdfPreview(true);
                            }}
                            onBack={OnClose}
                            kind={"warranty"}
                        />
                    ) : (
                        <RepairPdfPreview
                            signatureDataURL={signatureDataURL}
                            formData={formData}
                            checkInResponse={checkInResponse}
                            onBack={() => setShowPdfPreview(false)}
                            success={success}
                            setSuccess={setSuccess}
                            kind={"warranty"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WarrantyReceive;