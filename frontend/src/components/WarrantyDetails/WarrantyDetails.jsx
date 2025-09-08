import React, {useEffect, useState} from "react";
import WarrantyStepper from "../WarrantyStepper/WarrantyStepper.jsx";
import api from '../../config/ApiConfig';



const WarrantyDetails = ({ isOpen, onClose,data = {}, onSuccess}) => {
    if (!data) return null;
    const [photoFiles, setPhotoFiles] = useState(null);

    function SecureImage({ src, idx, openImageViewer }) {
        const [imageUrl, setImageUrl] = useState(null);

        useEffect(() => {
            const fetchImageWithAuth = async () => {
                try {
                    const response = await api.get(src, { responseType: 'blob' });
                    const blobUrl = URL.createObjectURL(response.data);
                    setImageUrl(blobUrl);
                } catch (err) {
                    console.error("Error fetching image:", err);
                }
            };

            fetchImageWithAuth();
        }, [src]);


        if (!imageUrl) {
            return <div className="w-full h-full bg-gray-200 animate-pulse rounded" />; // Skeleton while loading
        }

        return (
            <img
                src={imageUrl}
                alt={`Device condition ${idx + 1}`}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#f3f4f6",
                }}
                onClick={() => openImageViewer(idx)}
            />
        );
    }

    const downloadWarrantyPdf = async (warrantyNumber) => {
        try {
            const response = await api.get(`/warranty/getWarrantyPdf/${warrantyNumber}`, { responseType: 'blob' });
            const blob = response.data;
            const contentDisposition = response.headers['content-disposition'];
            const fileNameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const fileName = fileNameMatch ? fileNameMatch[1] : `Warranty-${warrantyNumber}.pdf`;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF download error:", error);
            alert("Something went wrong while downloading the PDF.");
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div
                className={`relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[95vh]
                  transform transition-all duration-700 scale-95 opacity-0
                  ${isOpen ? 'scale-100 opacity-100' : ''}`}
            >
                {/* Close Button (stays fixed at the top-right of the modal) */}
                <div className=" relative bg-white border-2 border-gray-200 shadow-lg rounded-lg overflow-y-auto max-h-[95vh] scrollbar-hide">
                    <button
                        onClick={onClose}
                        className=" absolute top-4 right-8 z-50 text-gray-600 hover:text-black text-2xl font-bold"
                    >
                        &times;
                    </button>
                    { /* Stepper Header */}
                    <div className=" justify-center bg-gray-100 border-b border-gray-200 p-6 pb-10">
                        <WarrantyStepper step={data.status}/>
                    </div>
            {/* Header */}
            <div className="grid justify-between m-6">
                <div className="text-xl font-semibold text-gray-800 mb-1">
                    Warranty Number: <span className="font-normal">{data.warrantyNumber}</span>
                </div>
                <div className="text-sm font-medium text-green-600">
                    Status: <span className="text- font-normal">{data.status.replace(/_/g, " ")}</span>
                </div>
            </div>

                    {data.warrantyPhotosUrls?.length === 0 && (
                        <div className="col-span-1 flex flex-col items-center">
                            <div className="w-full h-[50px] border border-green-600 border-dashed flex items-center justify-center bg-gray-100 ">
                                <p className="text-xl text-green-600 font-medium">
                                    *** Please bring the device to the store to proceed. ***
                                </p>
                            </div>
                        </div>
                    )}

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border rounded-lg p-6 m-6 mb-3">
                {/* Warranty Photos */}
                {data.warrantyPhotosUrls && data.warrantyPhotosUrls.length > 0 && (
                    <div className="col-span-1 flex flex-col items-center">
                        <p className="mb-2 font-semibold">Warranty Photos</p>
                        <div className="w-full h-[200px] border border-gray-300 flex items-center justify-center bg-gray-100">
                            {/* Secure image with auth */}
                            <SecureImage
                                src={data.warrantyPhotosUrls[0]}
                                idx={0}
                                openImageViewer={() => {}} // Can be replaced with real function if needed
                            />
                        </div>
                    </div>
                )}


                {/* Device Info */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div><strong>Device Name:</strong><br />{data.deviceName}</div>
                    <div><strong>Device Model:</strong><br />{data.model}</div>
                    <div><strong>Device Brand:</strong><br />{data.brand}</div>
                    <div><strong>Device Description:</strong><br />{data.deviceType}</div>
                    <div className="col-span-2"><strong>Return Reason:</strong><br />{data.returnReason}</div>
                    <div className="col-span-2"><strong>Reported Issue:</strong><br />{data.reportedIssue}</div>
                </div>
            </div>

            {/* Technician Observations */}
            <div className="m-6 mt-0">
                <strong>Technician Observations:</strong>
                <div className="mt-2 border border-gray-300 rounded p-3 bg-gray-50 text-gray-700 min-h-[80px]">
                    {data.techObservation || "No observations has been recorded yet."}
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 m-6 my-4">
                <button onClick={() => downloadWarrantyPdf(data.warrantyNumber)} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Download PDF
                </button>
                <button className="px-6 py-2 border border-gray-400 rounded hover:bg-gray-100" onClick={onClose}>
                    Close
                </button>

            </div>
        </div>
            </div>
        </div>
    );
};

export default WarrantyDetails;
