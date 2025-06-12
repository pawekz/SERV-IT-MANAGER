import React from "react";

const Spinner = ({ size = "normal" }) => {
    const sizeClasses = {
        small: "w-5 h-5 border-t-2 border-b-2",
        normal: "w-8 h-8 border-t-3 border-b-3",
        large: "w-16 h-16 border-t-4 border-b-4"
    };
    return (
        <div className={`${sizeClasses[size]} border-[#33e407] rounded-full animate-spin`}></div>
    );
};

export default Spinner;