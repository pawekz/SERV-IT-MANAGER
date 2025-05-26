"use client"
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import { useState } from "react"
import { ThumbsUp, Star } from "lucide-react"

const FeedbackForm = () => {
    const [ratings, setRatings] = useState({
        repairQuality: 0,
        customerService: 0,
        timeliness: 0,
        valueForMoney: 0,
        overallSatisfaction: 0,
    })

    const [additionalComments, setAdditionalComments] = useState("")
    const [improvementSuggestions, setImprovementSuggestions] = useState("")
    const [submitAnonymously, setSubmitAnonymously] = useState(false)
    const [allowContact, setAllowContact] = useState(false)

    const handleRatingChange = (category, rating) => {
        setRatings((prev) => ({
            ...prev,
            [category]: rating,
        }))
    }

    const StarRating = ({ rating, onRatingChange, category }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRatingChange(category, star)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={`w-6 h-6 ${
                                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                            } transition-colors`}
                        />
                    </button>
                ))}
            </div>
        )
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle form submission logic here
        console.log("Form submitted:", {
            ratings,
            additionalComments,
            improvementSuggestions,
            submitAnonymously,
            allowContact,
        })
    }

    const handleCancel = () => {
        // Handle cancel logic here
        console.log("Form cancelled")
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar placeholder - your existing Sidebar component would go here */}
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Service Feedback</h1>
                        <p className="text-gray-600">Please share your feedback about your recent repair experience.</p>
                    </div>

                    {/* Your Feedback Matters Section */}
                    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <ThumbsUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 mb-1">Your Feedback Matters</h2>
                                <p className="text-gray-600 text-sm">
                                    Help us improve our service by sharing your experience with your recent repair.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Information Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Repair Information */}
                        {/*<div className="bg-white rounded-lg p-6 border border-gray-200">*/}
                        {/*    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">*/}
                        {/*        <span className="text-gray-400">🔧</span>*/}
                        {/*        Repair Information*/}
                        {/*    </h3>*/}
                        {/*    <div className="space-y-3">*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Ticket ID:</span>*/}
                        {/*            <span className="font-medium">#RT-2305</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Device:</span>*/}
                        {/*            <span className="font-medium">iPhone 13 Pro</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Repair Type:</span>*/}
                        {/*            <span className="font-medium">Screen Replacement</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Status:</span>*/}
                        {/*            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">COMPLETED</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Completed On:</span>*/}
                        {/*            <span className="font-medium">Mar 25, 2025</span>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Customer Information */}
                        {/*<div className="bg-white rounded-lg p-6 border border-gray-200">*/}
                        {/*    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">*/}
                        {/*        <span className="text-gray-400">👤</span>*/}
                        {/*        Customer Information*/}
                        {/*    </h3>*/}
                        {/*    <div className="space-y-3">*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Name:</span>*/}
                        {/*            <span className="font-medium">James Wilson</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Email:</span>*/}
                        {/*            <span className="font-medium">j.wilson@example.com</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Phone:</span>*/}
                        {/*            <span className="font-medium">(555) 123-4567</span>*/}
                        {/*        </div>*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="text-gray-600">Technician:</span>*/}
                        {/*            <span className="font-medium">Sarah Johnson</span>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                    </div>

                    {/* Rating Section */}
                    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-gray-400">👍</span>
                            <h3 className="font-semibold text-gray-900">Rate Your Experience</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-6">
                            Please rate the following aspects of your repair experience. Your honest feedback helps us improve our
                            service.
                        </p>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Repair Quality</span>
                                <StarRating
                                    rating={ratings.repairQuality}
                                    onRatingChange={handleRatingChange}
                                    category="repairQuality"
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Customer Service</span>
                                <StarRating
                                    rating={ratings.customerService}
                                    onRatingChange={handleRatingChange}
                                    category="customerService"
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Timeliness</span>
                                <StarRating rating={ratings.timeliness} onRatingChange={handleRatingChange} category="timeliness" />
                            </div>

                            {/*<div className="flex justify-between items-center">*/}
                            {/*    <span className="font-medium text-gray-900">Value for Money</span>*/}
                            {/*    <StarRating*/}
                            {/*        rating={ratings.valueForMoney}*/}
                            {/*        onRatingChange={handleRatingChange}*/}
                            {/*        category="valueForMoney"*/}
                            {/*    />*/}
                            {/*</div>*/}

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Overall Satisfaction</span>
                                <StarRating
                                    rating={ratings.overallSatisfaction}
                                    onRatingChange={handleRatingChange}
                                    category="overallSatisfaction"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Additional Comments</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Please share any additional feedback, suggestions, or concerns about your repair experience.
                        </p>
                        <textarea
                            value={additionalComments}
                            onChange={(e) => setAdditionalComments(e.target.value)}
                            placeholder="Your comments here..."
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Improvement Section */}
                    {/*<div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">*/}
                    {/*    <h3 className="font-semibold text-gray-900 mb-2">How Can We Improve?</h3>*/}
                    {/*    <p className="text-gray-600 text-sm mb-4">*/}
                    {/*        Let us know if there's anything we could have done better during your repair experience.*/}
                    {/*    </p>*/}
                    {/*    <textarea*/}
                    {/*        value={improvementSuggestions}*/}
                    {/*        onChange={(e) => setImprovementSuggestions(e.target.value)}*/}
                    {/*        placeholder="Your suggestions for improvement..."*/}
                    {/*        className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"*/}
                    {/*    />*/}
                    {/*</div>*/}

                    {/* Checkboxes */}
                    {/*<div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">*/}
                    {/*    <div className="space-y-4">*/}
                    {/*        <label className="flex items-start gap-3">*/}
                    {/*            <input*/}
                    {/*                type="checkbox"*/}
                    {/*                checked={submitAnonymously}*/}
                    {/*                onChange={(e) => setSubmitAnonymously(e.target.checked)}*/}
                    {/*                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"*/}
                    {/*            />*/}
                    {/*            <div>*/}
                    {/*                <span className="font-medium text-gray-900">Submit feedback anonymously</span>*/}
                    {/*                <p className="text-gray-600 text-sm">*/}
                    {/*                    If checked, your name and contact information will not be associated with this feedback.*/}
                    {/*                </p>*/}
                    {/*            </div>*/}
                    {/*        </label>*/}

                    {/*        <label className="flex items-start gap-3">*/}
                    {/*            <input*/}
                    {/*                type="checkbox"*/}
                    {/*                checked={allowContact}*/}
                    {/*                onChange={(e) => setAllowContact(e.target.checked)}*/}
                    {/*                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"*/}
                    {/*            />*/}
                    {/*            <div>*/}
                    {/*                <span className="font-medium text-gray-900">IOCONNECT may contact me about my feedback</span>*/}
                    {/*                <p className="text-gray-600 text-sm">*/}
                    {/*                    If checked, a representative may reach out to discuss your feedback in more detail.*/}
                    {/*                </p>*/}
                    {/*            </div>*/}
                    {/*        </label>*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {/* Footer Message */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-gray-600 text-sm">
                            Your feedback is valuable to us and helps us improve our service. Thank you for taking the time to share
                            your experience.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeedbackForm
