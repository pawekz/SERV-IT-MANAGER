"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Sidebar from "../../components/SideBar/Sidebar.jsx"
import api, { parseJwt } from "../../config/ApiConfig"

const AccountInformation = () => {
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phoneNumber: "",
        password: "********", // Placeholder for security
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [editFormData, setEditFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        phoneNumber: "",
    })
    const [updateStatus, setUpdateStatus] = useState({ success: false, message: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true)

                // Check if we have cached user data in sessionStorage first
                const cachedUserData = sessionStorage.getItem("userData")
                if (cachedUserData) {
                    const parsedData = JSON.parse(cachedUserData)
                    setUserData(parsedData)
                    setLoading(false)
                    return
                }

                // Get token from localStorage if no cached data
                const token = localStorage.getItem("authToken")

                if (!token) {
                    throw new Error("Not authenticated. Please log in.")
                }

                // Try to parse token to get user info
                const decodedToken = parseJwt(token)

                if (decodedToken) {
                    const userData = {
                        firstName: decodedToken.firstName || "",
                        lastName: decodedToken.lastName || "",
                        username: decodedToken.username || decodedToken.sub || "",
                        email: decodedToken.email || decodedToken.sub || "",
                        phoneNumber: decodedToken.phoneNumber || "",
                        password: "********", // Mask password for security
                    }

                    setUserData(userData)

                    // Cache the user data in sessionStorage for persistence across refreshes
                    sessionStorage.setItem("userData", JSON.stringify(userData))
                } else {
                    // If token can't be decoded, could attempt API call to get user data
                    throw new Error("Could not retrieve user information")
                }
                setError(null)
            } catch (err) {
                console.error("Error fetching user data:", err)
                setError("Failed to load account information. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [])

    useEffect(() => {
        // Initialize edit form data with current user data
        if (userData) {
            setEditFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                phoneNumber: userData.phoneNumber,
            })
        }
    }, [userData])

    // Generate initials for avatar
    const getInitials = () => {
        if (userData.firstName && userData.lastName) {
            return `${userData.firstName.charAt(0).toUpperCase()}${userData.lastName.charAt(0).toUpperCase()}`
        }
        return "U" // Default if no name available
    }

    const handlePasswordRedirect = () => {
        navigate("/passwordmanagement")
    }

    const handleEditClick = () => {
        setIsEditing(true)
        setUpdateStatus({ success: false, message: "" })
    }

    const handleCloseEdit = () => {
        setIsEditing(false)
        // Reset form data to current user data
        setEditFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            phoneNumber: userData.phoneNumber,
        })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target

        // For firstName and lastName, only allow letters
        if (name === "firstName" || name === "lastName") {
            // Replace any non-letter characters with empty string
            const lettersOnly = value.replace(/[^a-zA-Z]/g, "")

            setEditFormData((prevData) => ({
                ...prevData,
                [name]: lettersOnly,
            }))
        } else {
            setEditFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setUpdateStatus({ success: false, message: "" })

        try {
            const token = localStorage.getItem("authToken")
            if (!token) {
                throw new Error("Not authenticated. Please log in.")
            }

            let usernameChanged = false

            // Update full name if changed
            if (userData.firstName !== editFormData.firstName || userData.lastName !== editFormData.lastName) {
                const response = await api.patch("/user/updateCurrentUserFullName", {
                    newFirstName: editFormData.firstName,
                    newLastName: editFormData.lastName,
                })
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.data || "Failed to update full name")
                }
            }

            // Update phone number if changed
            if (userData.phoneNumber !== editFormData.phoneNumber) {
                const response = await api.patch("/user/changeCurrentUserPhoneNumber", {
                    newPhoneNumber: editFormData.phoneNumber,
                })
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.data || "Failed to update phone number")
                }
            }

            // Update username if changed
            if (userData.username !== editFormData.username) {
                const response = await api.patch("/user/updateCurrentUsername", {
                    newUsername: editFormData.username,
                })
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.data || "Failed to update username")
                }
                usernameChanged = true
            }

            // Update local state and sessionStorage
            setUserData({
                ...userData,
                firstName: editFormData.firstName,
                lastName: editFormData.lastName,
                username: editFormData.username,
                phoneNumber: editFormData.phoneNumber,
            })
            sessionStorage.setItem(
                "userData",
                JSON.stringify({
                    firstName: editFormData.firstName,
                    lastName: editFormData.lastName,
                    username: editFormData.username,
                    email: editFormData.email || userData.email,
                    phoneNumber: editFormData.phoneNumber,
                    password: "********",
                }),
            )

            setUpdateStatus({
                success: true,
                message: usernameChanged ? "Username updated. Please log in again." : "Profile updated successfully!",
            })

            // If username changed, force logout and redirect to login after short delay
            if (usernameChanged) {
                setTimeout(() => {
                    localStorage.removeItem("authToken")
                    sessionStorage.removeItem("userData")
                    navigate("/login")
                }, 2000)
            } else {
                setTimeout(() => {
                    setIsEditing(false)
                }, 2000)
            }
        } catch (err) {
            setUpdateStatus({
                success: false,
                message: err.response?.data || err.message || "Failed to update profile. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            <div className="hidden lg:block w-[250px] flex-shrink-0">
                <Sidebar activePage={"accountinformation"} />
            </div>

            <div className="flex-1 bg-gray-50 min-w-0">
                <div className="lg:hidden">
                    <Sidebar activePage={"accountinformation"} />
                </div>

                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-sm sm:text-base">Loading account information...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p className="text-sm sm:text-base mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="text-blue-500 underline text-sm sm:text-base">
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <section className="mb-6 sm:mb-8 lg:mb-10">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                                    Account Information
                                </h2>

                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                                    <div
                                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gray-100 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl text-gray-400 flex-shrink-0"
                                        style={{ border: "2px solid rgba(51, 228, 7, 0.2)" }}
                                    >
                                        <span>{getInitials()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-1 truncate">
                                            {`${userData.firstName} ${userData.lastName}`}
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600 mb-4 break-words">{userData.email}</p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-6 sm:mb-8 lg:mb-10">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                                    Personal Information
                                </h2>

                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-600 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={userData.firstName}
                                                readOnly
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none text-sm sm:text-base"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-600 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={userData.lastName}
                                                readOnly
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none text-sm sm:text-base"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-2">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={userData.username}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={userData.email}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-800 font-normal focus:outline-none text-sm sm:text-base break-words"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                                        <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#33e407] focus-within:ring-1 focus-within:ring-[#33e407] transition-colors overflow-hidden">
                                            <div className="flex items-center bg-gray-50 px-2 sm:px-3 py-2 sm:py-3 border-r border-gray-200 flex-shrink-0">
                                                <img
                                                    src="https://flagcdn.com/16x12/ph.png"
                                                    alt="Philippine flag"
                                                    className="mr-1 sm:mr-2 w-4 sm:w-5 h-auto"
                                                />
                                                <span className="text-xs sm:text-sm text-gray-600">+63</span>
                                            </div>
                                            <input
                                                maxLength={13}
                                                type="tel"
                                                id="phoneNumber"
                                                value={userData.phoneNumber}
                                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-none focus:outline-none min-w-0"
                                                placeholder="905 123 4567"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                                <button
                                    onClick={handlePasswordRedirect}
                                    className="order-2 sm:order-1 py-2 sm:py-3 px-4 sm:px-6 rounded-md font-medium transition-all w-full sm:w-auto text-white bg-[#17A2B8] hover:bg-[#138496] text-sm sm:text-base"
                                >
                                    Change Password
                                </button>

                                <button
                                    onClick={handleEditClick}
                                    className="order-1 sm:order-2 py-2 sm:py-3 px-4 sm:px-6 rounded-md font-medium transition-all w-full sm:w-auto text-white bg-[#33e407] hover:bg-[#2bc706] text-sm sm:text-base"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </>
                    )}

                    <div className="text-center mt-4">
                        <Link to="#" className="font-medium hover:underline text-sm sm:text-base" style={{ color: "#33e407" }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col mx-4">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Edit Profile</h3>
                            <button onClick={handleCloseEdit} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 sm:h-6 sm:w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4">
                                {updateStatus.message && (
                                    <div
                                        className={`mb-4 p-3 rounded text-sm ${updateStatus.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                    >
                                        {updateStatus.message}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="edit-firstName"
                                            name="firstName"
                                            value={editFormData.firstName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                            pattern="[A-Za-z]+"
                                            title="Please enter only letters (no numbers or special characters)"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="edit-lastName"
                                            name="lastName"
                                            value={editFormData.lastName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                            pattern="[A-Za-z]+"
                                            title="Please enter only letters (no numbers or special characters)"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            id="edit-username"
                                            name="username"
                                            value={editFormData.username}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-phonenumber" className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                        </label>
                                        <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#33e407] focus-within:ring-1 focus-within:ring-[#33e407] transition-colors overflow-hidden">
                                            <div className="flex items-center bg-gray-50 px-2 sm:px-3 py-2 sm:py-3 border-r border-gray-200 flex-shrink-0">
                                                <img
                                                    src="https://flagcdn.com/16x12/ph.png"
                                                    alt="Philippine flag"
                                                    className="mr-1 sm:mr-2 w-4 sm:w-5 h-auto"
                                                />
                                                <span className="text-xs sm:text-sm text-gray-600">+63</span>
                                            </div>
                                            <input
                                                maxLength={10}
                                                type="text"
                                                id="phoneNumber"
                                                name="phoneNumber"
                                                value={editFormData.phoneNumber}
                                                onChange={handleInputChange}
                                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-none focus:outline-none min-w-0"
                                                placeholder="9051234567"
                                                required
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseEdit}
                                        className="order-2 sm:order-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="order-1 sm:order-2 px-4 py-2 bg-[#33e407] hover:bg-[#2bc706] text-white rounded-md text-sm"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Updating..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AccountInformation
