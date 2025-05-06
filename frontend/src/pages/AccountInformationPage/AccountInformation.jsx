import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link, useNavigate } from "react-router-dom";

const AccountInformation = () => {
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '********' // Placeholder for security
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Function to decode JWT token
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                // Get token from localStorage
                const token = localStorage.getItem('authToken');
                
                if (!token) {
                    throw new Error("Not authenticated. Please log in.");
                }
                
                // Try to parse token to get user info
                const decodedToken = parseJwt(token);
                
                if (decodedToken) {
                    setUserData({
                        firstName: decodedToken.firstName || '',
                        lastName: decodedToken.lastName || '',
                        email: decodedToken.email || decodedToken.sub || '',
                        password: '********' // Mask password for security
                    });
                } else {
                    // If token can't be decoded, could attempt API call to get user data
                    throw new Error("Could not retrieve user information");
                }
                setError(null);
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Failed to load account information. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Generate initials for avatar
    const getInitials = () => {
        if (userData.firstName && userData.lastName) {
            return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
        }
        return "U";  // Default if no name available
    };

    const handlePasswordRedirect = () => {
        navigate('/passwordmanagement');
    };

    return (
        <div className="font-sans bg-gray-50 min-h-screen">

            <Navbar />

            <main className="mt-20 py-8 flex justify-center">
                <div className="relative w-full max-w-3xl mx-4 bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Custom color matching #33e407 */}
                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: "#33e407" }}></div>

                    <div className="px-10 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-800">
                                IO<span style={{ color: "#33e407" }}>CONNECT</span>
                            </h1>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <p>Loading account information...</p>
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
                                <section className="mb-10">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Information</h2>

                                    <div className="flex items-center gap-6 md:flex-row flex-col md:text-left text-center">
                                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400"
                                            style={{ border: "2px solid rgba(51, 228, 7, 0.2)" }}>
                                            <span>{getInitials()}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {`${userData.firstName} ${userData.lastName}`}
                                            </h3>
                                            <p className="text-gray-600 mb-4">{userData.email}</p>
                                            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm transition-all hover:bg-gray-50 hover:border-gray-400">
                                                Change Profile Picture
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-10">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>

                                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                                        <div className="flex-1 mb-6 md:mb-0">
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-600 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={userData.firstName}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none"
                                                style={{
                                                    "&:focus": {
                                                        borderColor: "#33e407",
                                                        boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-600 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={userData.lastName}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none"
                                                style={{
                                                    "&:focus": {
                                                        borderColor: "#33e407",
                                                        boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={userData.email}
                                            readOnly
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none"
                                            style={{
                                                "&:focus": {
                                                    borderColor: "#33e407",
                                                    boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"
                                                }
                                            }}
                                        />
                                    </div>
                                </section>

                                {/*<section className="mb-10">*/}
                                {/*    <h2 className="text-xl font-semibold text-gray-800 mb-6">Change Password</h2>*/}

                                {/*    <div className="mb-6">*/}
                                {/*        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-600 mb-2">*/}
                                {/*            Current Password*/}
                                {/*        </label>*/}
                                {/*        <input*/}
                                {/*            type="password"*/}
                                {/*            id="currentPassword"*/}
                                {/*            name="currentPassword"*/}
                                {/*            placeholder="Enter your current password"*/}
                                {/*            className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none placeholder-gray-400"*/}
                                {/*            style={{*/}
                                {/*                "&:focus": {*/}
                                {/*                    borderColor: "#33e407",*/}
                                {/*                    boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"*/}
                                {/*                }*/}
                                {/*            }}*/}
                                {/*        />*/}
                                {/*    </div>*/}

                                {/*    <div className="flex flex-col md:flex-row gap-6 mb-6">*/}
                                {/*        <div className="flex-1 mb-6 md:mb-0">*/}
                                {/*            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600 mb-2">*/}
                                {/*                New Password*/}
                                {/*            </label>*/}
                                {/*            <input*/}
                                {/*                type="password"*/}
                                {/*                id="newPassword"*/}
                                {/*                name="newPassword"*/}
                                {/*                placeholder="Enter new password"*/}
                                {/*                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none placeholder-gray-400"*/}
                                {/*                style={{*/}
                                {/*                    "&:focus": {*/}
                                {/*                        borderColor: "#33e407",*/}
                                {/*                        boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"*/}
                                {/*                    }*/}
                                {/*                }}*/}
                                {/*            />*/}
                                {/*        </div>*/}
                                {/*        <div className="flex-1">*/}
                                {/*            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-2">*/}
                                {/*                Confirm New Password*/}
                                {/*            </label>*/}
                                {/*            <input*/}
                                {/*                type="password"*/}
                                {/*                id="confirmPassword"*/}
                                {/*                name="confirmPassword"*/}
                                {/*                placeholder="Confirm new password"*/}
                                {/*                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none placeholder-gray-400"*/}
                                {/*                style={{*/}
                                {/*                    "&:focus": {*/}
                                {/*                        borderColor: "#33e407",*/}
                                {/*                        boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"*/}
                                {/*                    }*/}
                                {/*                }}*/}
                                {/*            />*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*</section>*/}

                                <div className="flex md:flex-row flex-col-reverse justify-end gap-4 mb-6">
                                    <button className="bg-gray-100 text-gray-600 py-3 px-6 rounded-md font-medium transition-all hover:bg-gray-200 w-full md:w-auto">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePasswordRedirect}
                                        className="py-3 px-6 rounded-md font-medium transition-all w-full md:w-auto text-white bg-[#17A2B8] hover:bg-[#138496]">
                                        Change Password
                                    </button>

                                    <button
                                        className="py-3 px-6 rounded-md font-medium transition-all w-full md:w-auto text-white bg-[#33e407] hover:bg-[#2bc706]">
                                        Edit Profile
                                    </button>

                                </div>
                            </>
                        )}

                        <div className="text-center mt-4">
                            <Link to="#" className="font-medium hover:underline" style={{ color: "#33e407", "&:hover": { color: "#2bc706" } }}>
                                ← Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

        </div>
    );
};

export default AccountInformation;

