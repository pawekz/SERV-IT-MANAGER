const DeviceCard = () => {
    return (
        <div className="w-full max-w-md mx-auto border rounded-lg shadow-sm">
            <div className="p-6">
                {/* Person Info */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold">Kyle Matthew</h2>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>kyle@gmail.com</span>
                        <span>+63961999</span>
                    </div>
                </div>

                {/* Device Image */}
                <div className="relative w-full h-48 my-4 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    <img
                        src="https://media.cnn.com/api/v1/images/stellar/prod/lead-samsung-galaxy-s25-ultra-cnnu-11.jpg?c=16x9&q=h_833,w_1480,c_fill"
                        alt="Device"
                        // width="400"
                        // height="200"
                        className="max-h-full max-w-full object-contain p-4"
                    />
                </div>

                {/* Device Details */}
                <div className="grid grid-cols-2 gap-2 text-sm my-4 border rounded-md p-3">
                    <div className="flex flex-col">
                        <span className="font-medium">Device Type:</span>
                        <span>Phone</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Color:</span>
                        <span>White</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Serial Number:</span>
                        <span>T31454</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Model:</span>
                        <span>Samsung Galaxy 13</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Brand:</span>
                        <span>SAMSUNG</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Password:</span>
                        <span>Tree123</span>
                    </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between mt-6">
                    <div className="w-[45%]">
                        <div className="border-b border-dashed border-gray-400 h-10 mb-1"></div>
                        <p className="text-center text-sm">Customer Signature</p>
                    </div>
                    {/*<div className="w-[45%]">*/}
                    {/*    <div className="border-b border-dashed border-gray-400 h-10 mb-1"></div>*/}
                    {/*    <p className="text-center text-sm">Technician Signature</p>*/}
                    {/*</div>*/}
                </div>
            </div>
        </div>
    )
}


export default DeviceCard

