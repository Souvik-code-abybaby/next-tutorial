"use client";

import { useState, useEffect, useCallback } from "react";

// baseUrl should end with a trailing slash, matching the Postman collection
// (e.g. https://api.yourapp.com/) since endpoints are appended directly:
// `${API_BASE}user-add`, `${API_BASE}user-edit`, etc.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const emptyForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  role_id: "",
  image: null, // File object, not a URL string — sent as form-data
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // The bearer token comes from wherever your login flow stores it
  // (e.g. set this in localStorage right after a successful login:
  // localStorage.setItem("token", data.token)). Never hardcode a real
  // token in source — it ships to every browser that loads this page.
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  // For JSON requests (GET / DELETE, and PUT if your backend accepts JSON there)
  const jsonHeaders = () => ({
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    Authorization: `Bearer ${getToken()}`,
  });

  // For form-data requests (POST user-add) — do NOT set Content-Type here,
  // the browser needs to set its own multipart boundary automatically.
  const formHeaders = () => ({
  
    "x-api-key": API_KEY,
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchUsers = useCallback(async () => {
    // setLoading(true);
    setError("");
    try {
      // Matches your Postman "User List" request: POST {{baseUrl}}user-list
      // with a JSON body of { page, limit }. Update page/limit here (or wire
      // up a pagination control) once you need more than the first 100 users.
      const res = await fetch(`${API_BASE}user-list`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      const body = await res.json();

      // Confirmed shape: { page, limit, total_records, results: [...] }
      setUsers(Array.isArray(body.results) ? body.results : []);
      console.log(Array.isArray(users))
    } catch (err) {
      setError(err.message || "Something went wrong while loading users.");
    } finally {
    //   setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const openAddForm = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setFormData({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "", // never prefill password
      gender: user.gender || "",
      role_id: user.role_id ?? "",
      image: null, // existing photo shown via user.profile_url; only set this if replacing it
    });
    setIsEditing(true);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormData(emptyForm);
    setIsEditing(false);
  };

  const buildFormData = () => {
    const fd = new FormData();
    if (isEditing) fd.append("id", formData.id); // only sent on edit, per Postman
    fd.append("name", formData.name);
    if (!isEditing) fd.append("email", formData.email); // edit has no email field
    fd.append("phone", formData.phone);
    if (!isEditing && formData.password) fd.append("password", formData.password); // add-only
    fd.append("gender", formData.gender);
    fd.append("role_id", formData.role_id);
    if (formData.image) fd.append("image_url", formData.image); // file field, matches Postman key
      for (const [key, value] of fd.entries()) {
    console.log(key, ":", value);
  }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Both add and edit are POST with form-data bodies:
      // POST {{baseUrl}}user-add  — new user
      // POST {{baseUrl}}user-edit — id goes inside the form-data body, not the URL
      const url = isEditing ? `${API_BASE}user-edit` : `${API_BASE}user-add`;

      const res = await fetch(url, {
        method: "POST",
        headers: formHeaders(),
        body: buildFormData(),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to save user (${res.status})`);
      }

      await fetchUsers();
      closeForm();
    } catch (err) {
      setError(err.message || "Something went wrong while saving the user.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (user) => setDeleteTarget(user);
  const cancelDelete = () => setDeleteTarget(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    setError("");

    try {
      // Endpoint not confirmed yet — guessing DELETE {{baseUrl}}user-delete/:id
      // following the same naming pattern as user-add. Update once confirmed.
      const res = await fetch(`${API_BASE}user-delete/${deleteTarget.id}`, {
        method: "DELETE",
        headers: jsonHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to delete user (${res.status})`);

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Something went wrong while deleting the user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Users</h1>
            <p className="text-gray-500 mt-1">Add, edit, or remove user accounts</p>
          </div>

          <button
            onClick={openAddForm}
            className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Add user
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {  (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="text-gray-800">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {user.profile_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.profile_url}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
                            {user.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        {user.name}
                      </td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.phone}</td>
                      <td className="px-6 py-4">{user.role_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            user.status === "1"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {user.status === "1" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(user)}
                            className="text-sm font-medium text-green-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(user)}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {isEditing ? "Edit user" : "Add user"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-black focus:ring-2 focus:ring-green-500"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-gray-500">
                    {formData.email} <span className="text-xs">(can't be changed here)</span>
                  </p>
                </div>
              )}

              {!isEditing && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-black focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-black focus:ring-2 focus:ring-green-500"
                />
              </div>

              {!isEditing && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-black focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none text-black focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role_id"
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none text-black focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select role</option>
                  <option value="1">Admin</option>
                  <option value="2">Tele Sales</option>
                  {/* Add any other role_id/role_name pairs your backend supports */}
                </select>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile image {isEditing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none text-black text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium hover:file:bg-green-100 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="w-1/2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
                >
                  {submitting ? "Saving…" : isEditing ? "Save changes" : "Add user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete user</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="w-1/2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="w-1/2 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {submitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}