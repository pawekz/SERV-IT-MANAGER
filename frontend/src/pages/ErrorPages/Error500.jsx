"use client"

export default function Error500() {
    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.4) 0%, rgba(255, 255, 255, 0.5) 100%)',
            }}
        >
            <div className="max-w-2xl w-full text-center">
                {/* Header Text */}
                <div className="mb-0">
                    <p className="text-sm font-semibold text-gray-800 tracking-wide">AUTHORIZATION REQUIRED</p>
                </div>

                {/* 500 Error Code */}
                <div className="mb-8">
                    <div className="text-9xl font-bold text-[#25D482] mb-2">500</div>
                </div>

                {/* Description Text */}
                <div className="mb-12">
                    <p className="text-gray-800 font-semibold mb-2">WE'RE SORRY BUT THE SERVER ENCOUNTERED AN ERROR</p>
                    <p className="text-gray-700 text-sm">PLEASE TRY AGAIN LATER</p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col items-center gap-4">
                    <button
                        className="px-12 py-3 bg-[#25D482] text-white font-semibold rounded hover:opacity-90 transition-opacity"
                        onClick={() => (window.location.href = "/")}
                    >
                        Go to Home
                    </button>
                    <button
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                        onClick={() => window.history.back()}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}