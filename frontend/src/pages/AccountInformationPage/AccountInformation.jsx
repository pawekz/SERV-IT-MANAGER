import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link } from "react-router-dom";

const AccountInformation = () => {
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

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Information</h2>

                            <div className="flex items-center gap-6 md:flex-row flex-col md:text-left text-center">
                                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400"
                                    style={{ border: "2px solid rgba(51, 228, 7, 0.2)" }}>
                                    <span>JD</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">John Doe</h3>
                                    <p className="text-gray-600 mb-4">john.doe@example.com</p>
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
                                        value="John"
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
                                        value="Doe"
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
                                    value="john.doe@example.com"
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

                        <section className="mb-10">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Change Password</h2>

                            <div className="mb-6">
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-600 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    placeholder="Enter your current password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none placeholder-gray-400"
                                    style={{
                                        "&:focus": {
                                            borderColor: "#33e407",
                                            boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 mb-6">
                                <div className="flex-1 mb-6 md:mb-0">
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none placeholder-gray-400"
                                        style={{
                                            "&:focus": {
                                                borderColor: "#33e407",
                                                boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none placeholder-gray-400"
                                        style={{
                                            "&:focus": {
                                                borderColor: "#33e407",
                                                boxShadow: "0 0 0 2px rgba(51, 228, 7, 0.1)"
                                            }
                                        }}
                                    />
                                </div>
                            </div>


                        </section>

                        <div className="flex md:flex-row flex-col-reverse justify-end gap-4 mb-6">
                            <button className="bg-gray-100 text-gray-600 py-3 px-6 rounded-md font-medium transition-all hover:bg-gray-200 w-full md:w-auto">
                                Cancel
                            </button>
                            <button className="py-3 px-6 rounded-md font-medium transition-all w-full md:w-auto text-white"
                                style={{ backgroundColor: "#33e407", "&:hover": { backgroundColor: "#2bc706" } }}>
                                Save Changes
                            </button>
                        </div>

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