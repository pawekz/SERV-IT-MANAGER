"use client"

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RepairForm from "../../components/RepairForm/RepairForm.jsx";
import SignatureCapturePad from "../SignatureCapturePad/SignatureCapturePad.jsx";
import RepairPdfPreview from "../../components/RepairPdfPreview/RepairPdfPreview.jsx";

export default function NewRepair() {
    const location = useLocation();
    const [formData, setFormData] = useState(location.state?.formData || {});
    const [signatureDataURL, setSignatureDataURL] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false); // <-- Add this
    const [checkInResponse, setCheckInResponse] = useState(null);
    const [step, setStep] = useState(0);

    function renderStep() {
        if (step === 0) {
            return (
                <RepairForm
                    status="new"
                    formData={formData}
                    onNext={data => {
                        setFormData(data);
                        setStep(1);
                    }}
                />
            );
        }
        if (step === 1) {
            return (
                <SignatureCapturePad
                    onBack={() => setStep(0)}
                    formData={formData}
                    signatureDataURL={signatureDataURL}
                    setSignatureDataURL={setSignatureDataURL}
                    termsAccepted={termsAccepted}
                    setTermsAccepted={setTermsAccepted}
                    onSubmit={sigDataUrl => {
                        setSignatureDataURL(sigDataUrl);
                        setStep(2);
                    }}
                />
            );
        }
        if (step === 2) {
            return (
                <RepairPdfPreview
                    signatureDataURL={signatureDataURL}
                    formData={formData}
                    checkInResponse={checkInResponse}
                    onBack={() => setStep(1)}
                />
            );
        }
        return null;
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <ol className="flex justify-center items-center w-full max-w-xl mx-auto ml-56">
                <li className={`flex w-full items-center text-[#33e407] dark:text-[#33e407] after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block ${
                    step > 0
                        ? "after:border-[#33e407]/20 dark:after:border-[#33e407]/40"
                        : "after:border-gray-100 dark:after:border-gray-700"
                }`}>
                <span className="flex items-center justify-center w-10 h-10 bg-[#33e407]/20 rounded-full lg:h-12 lg:w-12 dark:bg-[#33e407]/30 shrink-0">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-[#33e407] dark:text-[#33e407]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                        <path d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z" />
                    </svg>
                </span>
                </li>
                <li className={`flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block ${
                    step === 2
                        ? "after:border-[#33e407]/20 dark:after:border-[#33e407]/40"
                        : "after:border-gray-100 dark:after:border-gray-700 text-gray-500 dark:text-gray-700"
                }`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${
                    step > 0
                        ? "bg-[#33e407]/20 dark:bg-[#33e407]/30 text-[#33e407] dark:text-[#33e407]"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100"
                }`}>
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                        <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2ZM7 2h4v3H7V2Zm5.7 8.289-3.975 3.857a1 1 0 0 1-1.393 0L5.3 12.182a1.002 1.002 0 1 1 1.4-1.436l1.328 1.289 3.28-3.181a1 1 0 1 1 1.392 1.435Z" />
                    </svg>
                </span>
                </li>
                <li className="flex items-center w-full">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${
                    step === 2
                        ? "bg-[#33e407]/20 dark:bg-[#33e407]/30 text-[#33e407] dark:text-[#33e407]"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-100"
                }`}>
                    <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917 5.724 10.5 15 1.5" />
                    </svg>
                </span>
                </li>
            </ol>
            {renderStep()}
        </div>
    );
}