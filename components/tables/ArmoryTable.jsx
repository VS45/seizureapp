'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Eye, Edit, MoreVertical } from 'lucide-react';

export function ArmoryTable({ armories }) {
  if (armories.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No armories found matching your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name & Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Weapons
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {armories.map((armory) => (
            <tr key={armory._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <Link 
                    href={`/armory/armories/${armory._id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-900"
                  >
                    {armory.armoryName}
                  </Link>
                  <div className="text-sm text-gray-500">{armory.armoryCode}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{armory.location}</div>
                <div className="text-sm text-gray-500">{armory.unit}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {armory.weapons?.length || 0} weapons
                </div>
                <div className="text-sm text-gray-500">
                  {armory.ammunition?.length || 0} ammo types
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`
                  inline-flex px-2 py-1 text-xs font-medium rounded-full
                  ${armory.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  ${armory.status === 'inactive' ? 'bg-gray-100 text-gray-800' : ''}
                  ${armory.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : ''}
                `}>
                  {armory.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(armory.updatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Link
                    href={`/armory/armories/${armory._id}`}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/armory/armories/${armory._id}/manage-inventory`}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    inventory
                  </Link>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}