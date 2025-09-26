
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to seizures page after 8 seconds
    const timer = setTimeout(() => {
      router.push('/seizures');
    }, 8000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Seizure Report Submitted Successfully!
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Your seizure report has been successfully recorded in the system.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Next Steps</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>• You will receive a confirmation email shortly</p>
                <p>• The case will be reviewed by the appropriate authorities</p>
                <p>• You can track the status in your dashboard</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mt-4">
                Reference Number: <span className="font-medium">NCS/ABJ/001/2023/SZ/45</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Submission Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => router.push('/seizures')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                View All Seizures
              </button>
              <button
                onClick={() => router.push('/seizures/new')}
                className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create Another Report
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>You will be automatically redirected to the seizures page in a few seconds...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}