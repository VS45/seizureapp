'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import DistributionForm from '@/components/DistributionForm';

export default function EditDistributionPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const distributionId = params.id;

  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && distributionId) {
      fetchDistribution();
    }
  }, [user, distributionId]);

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/distributions/${distributionId}`);
      if (response.ok) {
        const data = await response.json();
        setDistribution(data);
      } else {
        console.error('Failed to fetch distribution');
        router.push('/distributions');
      }
    } catch (error) {
      console.error('Error fetching distribution:', error);
      router.push('/distributions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDistribution = async (formData) => {
    try {
      const response = await fetch(`/api/distributions/${distributionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Distribution updated successfully!');
        router.push(`/distributions/${distributionId}`);
      } else {
        const error = await response.json();
        alert(`Failed to update distribution: ${error.error}`);
      }
    } catch (error) {
      console.error('Distribution update failed:', error);
      alert('Failed to update distribution');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!distribution) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribution Not Found</h2>
        <button
          onClick={() => router.push('/distributions')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Distributions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DistributionForm
        distribution={distribution}
        onSubmit={handleUpdateDistribution}
        isEditing={true}
      />
    </div>
  );
}