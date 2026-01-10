'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', issues: 45 },
  { month: 'Feb', issues: 52 },
  { month: 'Mar', issues: 48 },
  { month: 'Apr', issues: 61 },
  { month: 'May', issues: 55 },
  { month: 'Jun', issues: 58 },
];

export function IssuanceChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Issuance</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="issues" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}