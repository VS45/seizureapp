// components/StatsCard.js
'use client';

export default function StatsCard({ title, value, trend, bgColor, textColor, borderColor }) {
  const trendIcons = {
    up: (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 01-1-1V5.414l-4.293 4.293a1 1 0 01-1.414-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 5.414V6a1 1 0 01-1 1z" clipRule="evenodd" />
      </svg>
    ),
    down: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 13a1 1 0 01-1 1V14.586l-4.293-4.293a1 1 0 011.414-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L11 16.414V15a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
    ),
    stable: (
      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className={`${bgColor} ${borderColor} overflow-hidden shadow rounded-lg border`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 rounded-md p-3">
            {trendIcons[trend]}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className={`text-sm font-medium ${textColor} truncate`}>
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className={`text-2xl font-semibold ${textColor}`}>
                {value}
              </div>
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}