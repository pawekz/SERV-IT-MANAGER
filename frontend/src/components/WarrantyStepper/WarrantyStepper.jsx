import React from "react";

const steps = [
    { key: "CHECKED_IN", icon: "user", label: "Checked In" },
    { key: "ITEM_RETURNED", icon: "box", label: "Item Returned" },
    { key: "WAITING_FOR_WARRANTY_REPLACEMENT", icon: "clock", label: "Awaiting Replacement" },
    { key: "WARRANTY_REPLACEMENT_ARRIVED", icon: "truck", label: "Replacement Arrived" },
    { key: ["WARRANTY_REPLACEMENT_COMPLETED", "DENIED"], icon: "check", label: "Completed" },
];

const icons = {
    user: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24">
            <rect width="8" height="4" x="8" y="2" rx="1"/>
            <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5"/>
            <path d="M16 4h2a2 2 0 0 1 1.73 1"/>
            <path d="M8 18h1"/>
            <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
        </svg>
    ),
    box: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path
                d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
            <path d="M12 22V12"/>
            <polyline points="3.29 7 12 12 20.71 7"/>
            <path d="m7.5 4.27 9 5.15"/>
        </svg>
    ),
    clock: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 6v6h6"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
    ),
    truck: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m16 16 2 2 4-4"/>
            <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
            <path d="m7.5 4.27 9 5.15"/>
            <polyline points="3.29 7 12 12 20.71 7"/>
            <line x1="12" x2="12" y1="22" y2="12"/>
        </svg>
    ),
    check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 6 7 17l-5-5"/>
            <path d="m22 10-7.5 7.5L13 16"/>
        </svg>
    ),
};

const WarrantyStepper = ({step}) => {
    const currentIndex = steps.findIndex((s) =>
        Array.isArray(s.key) ? s.key.includes(step) : s.key === step);

    return (

        <div className="w-full flex justify-center px-4 py-8">
            <ol className="grid grid-cols-5 gap-2 w-full max-w-4xl ml-9">
                {steps.map((s, index) => {
                    const isActive = index <= currentIndex;
                    const isLast = index === steps.length - 1;

                    return (
                        <li
                            key={s.key}
                            className={`flex items-center w-full ${
                                !isLast &&
                                `after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block ${
                                    isActive
                                        ? "after:border-[#33e407]/50"
                                        : "after:border-gray-200 dark:after:border-gray-600"
                                }`
                            }`}
                        >
                            <div className={`grid grid-cols-1 items-center w-full text-center ${
                                isLast &&
                                `-ml-10
                                `
                            }`}>
                            <span
                                className={`flex items-center justify-center h-10 rounded-full lg:h-12 lg:w-12 mx-auto ${
                                    isActive
                                        ? "bg-[#33e407]/20 text-[#33e407]"
                                        : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-100"
                                }`}
                            >
                              {icons[s.icon]}
                            </span>
                                <div className="mt-2 text-xs text-center -mb-10">{s.label}</div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>

    );
};

export default WarrantyStepper;