import React from 'react';

export const CarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17H6.511a1 1 0 01-.9-1.447L8.5 8.5h7l2.889 7.053a1 1 0 01-.9 1.447H13" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5H5.472a1 1 0 00-.97.724L3.5 13.5h17l-1.002-4.276a1 1 0 00-.97-.724H15.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5l2-4.5h3l2 4.5" />
    </svg>
);
