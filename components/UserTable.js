// components/UserTable.js
import { FiEdit, FiUserX, FiUserCheck, FiTrash2 } from 'react-icons/fi';

export default function UserTable({ users, onEdit, onDeactivate, onActivate, onDelete }) {
  const getStatusBadge = (isVerified) => {
    return isVerified !== false ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-800',
      creator: 'bg-blue-100 text-blue-800',
      validator: 'bg-yellow-100 text-yellow-800',
      analyst: 'bg-indigo-100 text-indigo-800',
      legal: 'bg-pink-100 text-pink-800',
      user: 'bg-gray-100 text-gray-800',
      armourer: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Service Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Office
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status & Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.serviceNo}</div>
                <div className="text-sm text-gray-500">{user.rank}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.office?.code}</div>
                <div className="text-sm text-gray-500">{user.office?.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  {getStatusBadge(user.isVerified)}
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit(user)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit user"
                >
                  <FiEdit className="inline" />
                </button>
                {user.isVerified !== false ? (
                  <button
                    onClick={() => onDeactivate(user._id)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Deactivate user"
                  >
                    <FiUserX className="inline" />
                  </button>
                ) : (
                  <button
                    onClick={() => onActivate(user._id)}
                    className="text-green-600 hover:text-green-900"
                    title="Activate user"
                  >
                    <FiUserCheck className="inline" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(user._id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete user"
                >
                  <FiTrash2 className="inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}