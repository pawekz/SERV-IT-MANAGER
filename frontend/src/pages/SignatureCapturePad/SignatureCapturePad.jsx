"use client"

import { useRef, useState, useEffect } from "react"

const SignatureCapturePad = () => {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [context, setContext] = useState(null)
    const [isEmpty, setIsEmpty] = useState(true)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        // Set canvas styling
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.strokeStyle = "#000000"

        // Set canvas dimensions to match parent container
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        // Clear canvas with white background
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        setContext(ctx)

        // Handle window resize
        const handleResize = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            ctx.fillStyle = "#ffffff"
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

    // Helper function to get coordinates for both mouse and touch events
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
        context.fillStyle = "#ffffff"
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

        // Here you can handle the signature data as needed
        // For example, you could save it to state, send to a server, etc.
        console.log("Signature saved:", dataUrl)
        alert("Signature saved successfully!")
    }

    const handleBack = () => {
        // Handle back button functionality
        console.log("Back button clicked")
    }

    const handleNext = () => {
        // Handle next button functionality
        if (isEmpty) {
            alert("Please provide a signature before proceeding.")
            return
        }
        console.log("Next button clicked")
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center py-8">
            <div className="flex flex-col items-center max-w-2xl w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Green sidebar */}
                <div className="flex w-full ">
                    <div className="w-1 bg-[#33e407] "></div>
                    <div className="flex-1 p-8">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold">
                                <span className="text-gray-800">IO</span>
                                <span className="text-[#33e407]">CONNECT</span>
                            </h1>
                            <h2 className="text-xl font-semibold text-gray-800 mt-4">Digital Signature</h2>
                            <p className="text-gray-600 mt-1">Sign using mouse, touch, or stylus</p>
                        </div>

                        {/* Instructions */}
                        <p className="text-center text-gray-600 mb-4">Please sign in the box below to complete your claim form</p>

                        {/* Signature Pad */}
                        <div className="border border-gray-300 rounded-md mb-4 relative">
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

                        {/* Buttons */}
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
                                <button
                                    onClick={saveSignature}
                                    className="flex items-center px-4 py-2 bg-[#33e407] hover:bg-[#2dc406] text-white rounded-md transition-colors"
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
                                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                        />
                                    </svg>
                                    Save Signature
                                </button>
                            </div>

                            {/* Back and Next buttons */}
                            <div className="flex w-full justify-between mt-4">
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-[#33e407] hover:bg-[#2dc406]  text-white rounded-md transition-colors"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-center text-gray-500 text-sm mt-6">
                            By signing, you confirm that all information provided is accurate and complete.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignatureCapturePad
