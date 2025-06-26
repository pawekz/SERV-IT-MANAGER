import Sidebar from "../../components/SideBar/Sidebar.jsx";
import { useState } from "react";
import { ThumbsUp, Star, Loader } from "lucide-react";
import api from "../../services/api.jsx";
import { useParams, useNavigate } from "react-router-dom";

const FeedbackForm = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();

    const [ratings, setRatings] = useState({
        repairQuality: 0,
        customerService: 0,
        timeliness: 0,
        overallSatisfaction: 0,
    });

    const [additionalComments, setAdditionalComments] = useState("");
    const [submitAnonymously, setSubmitAnonymously] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleRatingChange = (category, rating) => {
        setRatings((prev) => ({
            ...prev,
            [category]: rating,
        }));
    };

    const calculateOverallRating = () => {
        const { repairQuality, customerService, timeliness, overallSatisfaction } = ratings;
        const totalRating = repairQuality + customerService + timeliness + overallSatisfaction;
        // Calculate as a percentage of maximum possible rating (20 points total)
        // This gives a rating from 1-5 based on the total score out of 20
        const calculatedRating = Math.round((totalRating / 20) * 5);
        // Ensure rating is between 1-5 if any rating was given
        return totalRating > 0 ? Math.max(1, calculatedRating) : 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare the data for the backend
            const feedbackData = {
                rating: calculateOverallRating(),
                comments: additionalComments,
                repairTicketId: parseInt(ticketId) || 0,
                anonymous: submitAnonymously
            };

            // Make the API call
            const response = await api.post('/feedback/submitFeedback', feedbackData);

            console.log('Feedback submitted successfully:', response.data);
            setSuccess(true);

            // Redirect after successful submission
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            console.error('Error submitting feedback:', err);
            setError('Failed to submit feedback. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/dashboard');
    };

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
        );
    };

    // If successfully submitted, show success screen
    if (success) {
        return (
            <div className="flex min-h-screen bg-gray-50 items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <ThumbsUp className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-600 mb-6">
                        Your feedback has been successfully submitted. We appreciate your time and input.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        You will be redirected to the dashboard in a moment...
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Loading overlay when submitting
    const LoadingOverlay = () => (
        isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
                    <Loader className="h-8 w-8 text-green-600 animate-spin mb-4" />
                    <p className="text-gray-700">Submitting feedback...</p>
                </div>
            </div>
        )
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <LoadingOverlay />

            <div className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Service Feedback</h1>
                        <p className="text-gray-600">Please share your feedback about your recent repair experience.</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            <p>{error}</p>
                        </div>
                    )}

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

                    <form onSubmit={handleSubmit}>
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

                        {/* Anonymous option */}
                        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                            <div className="space-y-4">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={submitAnonymously}
                                        onChange={(e) => setSubmitAnonymously(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">Submit feedback anonymously</span>
                                        <p className="text-gray-600 text-sm">
                                            If checked, your name and contact information will not be associated with this feedback.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

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
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackForm;