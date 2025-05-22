import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {HardDriveDownload } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import ScheduleTab from "../../components/ScheduleTab/ScheduleTab.jsx";

{/* replace with proper components Tab */}
const DestinationTab = () => <div>Destination & Storage content goes here.</div>;
const HistoryTab = () => <div>Back Up History content goes here.</div>;

const tabTitles = [
    'Schedule',
    'Destination & Storage',
    'Back Up History'
];

const BackUpPage = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(tabTitles[0]);


    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">

            <Sidebar activePage="backup" />

            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="flex justify-between">
                <div className="mb-4">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">Back Up and Recovery</h1>
                    <p className="text-gray-600 text-base max-w-3xl">
                        Configure automated backup schedules, destinations, and security settings.
                    </p>
                </div>
                <div className=" w-64 shrink right-0 -mr-5">
                    <button className=" flex py-3 px-6 rounded-md font-medium transition-all w-50 md:w-auto text-white bg-[#33e407] hover:bg-[#2bc706]">
                        <HardDriveDownload className="mr-2"/>  Manual Back Up
                    </button>
                </div>
                </div>
                <div className="px-10 py-8">
                    {loading ? (
                        <div className="text-center py-8">
                            <p>Loading backup information...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 text-blue-500 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <section className="mb-8 -ml-10">
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex flex-wrap border-b border-gray-300 mb-6 ">
                                        {tabTitles.map((title) => (
                                            <button
                                                key={title}
                                                className={`px-4 py-2 font-medium transition ${
                                                    activeTab === title
                                                        ? 'border-b-2 border-[#01e135] text-[#01e135]'
                                                        : 'text-gray-600 hover:text-[#01e135]'
                                                }`}
                                                onClick={() => setActiveTab(title)}
                                            >
                                                {title}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div className="bg-white p-8">
                                        {activeTab === 'Schedule' && <ScheduleTab />}
                                        {activeTab === 'Destination & Storage' && <DestinationTab />}
                                        {activeTab === 'Back Up History' && <HistoryTab />}
                                    </div>
                                    </div>
                            </section>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

export default BackUpPage;

