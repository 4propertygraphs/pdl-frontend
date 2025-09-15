import React, { useEffect, useState } from 'react';
import apiService from '../services/ApiService';
import SearchBarModal from '../components/SearchBar.tsx';

type FieldMapping = {
    id: number;
    field_name: string;
    acquaint_crm: string;
    propertydrive: string;
    daft: string;
    myhome: string;
};

const emptyMapping: Omit<FieldMapping, 'id'> = {
    field_name: '',
    acquaint_crm: '',
    propertydrive: '',
    daft: '',
    myhome: ''
};

function FieldMappings() {
    const [mappings, setMappings] = useState<FieldMapping[]>([]);
    const [originalMappings, setOriginalMappings] = useState<FieldMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<FieldMapping | null>(null);
    const [form, setForm] = useState<Omit<FieldMapping, 'id'>>(emptyMapping);
    const [adding, setAdding] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchMappings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiService.GetFieldMappings();
            setMappings(res.data);
            setOriginalMappings(res.data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    useEffect(() => {
        if (searchText.trim() === '') {
            setMappings(originalMappings);
        } else {
            setMappings(
                originalMappings.filter((mapping) =>
                    mapping.field_name.toLowerCase().includes(searchText.toLowerCase())
                )
            );
        }
    }, [searchText, originalMappings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleEdit = (mapping: FieldMapping) => {
        setEditing(mapping);
        setForm({
            field_name: mapping.field_name,
            acquaint_crm: mapping.acquaint_crm,
            propertydrive: mapping.propertydrive,
            daft: mapping.daft,
            myhome: mapping.myhome
        });
        setAdding(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this field mapping?')) return;
        await apiService.deleteFieldMapping(id);
        fetchMappings();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            await apiService.updateFieldMapping(editing.id, form);
        } else {
            await apiService.addFieldMapping(form);
        }
        setEditing(null);
        setAdding(false);
        setForm(emptyMapping);
        fetchMappings();
    };

    const handleAddNew = () => {
        setEditing(null);
        setForm(emptyMapping);
        setAdding(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    const refreshMappings = async () => {
        fetchMappings();
    };

    return (
        <div className="min-h-screen ml-0 sm:ml-64 dark:bg-gray-800 flex flex-col overflow-auto">
            {/* Fixed search bar at the top of the viewport */}
            <div className="fixed top-0 left-0 sm:left-64 right-0 bg-gray-100 dark:bg-gray-800 z-30">
                <SearchBarModal
                    searchText={searchText}
                    onSearchChange={handleSearchChange}
                    onRefresh={refreshMappings}
                    agency={null}
                    title="Field Mappings"
                    placeholder="Search field name..."
                    filters={
                        <span
                            className="cursor-pointer text-purple-600 dark:text-purple-400 underline"
                            onClick={handleAddNew}
                        >
                            Add Field Mapping
                        </span>
                    }
                />
            </div>

            {/* Add padding to account for the fixed search bar */}
            <div className="pt-32 sm:pt-36 flex flex-col flex-1">
                <div className="flex-1 my-1 sm:my-2 px-0 sm:px-4 bg-gray-100 dark:bg-gray-800">
                    <div className="dark:bg-gray-900 bg-gray-100">
                        {error && <div className="text-red-500 mb-2">{error}</div>}
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <div className="bg-white dark:bg-gray-900">
                                    <table className="min-w-[600px] w-full bg-white dark:bg-gray-900 dark:text-gray-200 border">
                                        <thead className="dark:bg-gray-900 sticky top-0 z-20 border-b-2 border-purple-300 dark:border-gray-600">
                                            <tr>
                                                <th className="border dark:border-gray-700 px-4 py-3 pt-5 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium">Field Name</th>
                                                <th className="border dark:border-gray-700 px-4 py-3 pt-5 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium">Acquaint CRM</th>
                                                <th className="border dark:border-gray-700 px-4 py-3 pt-5 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium">PropertyDrive</th>
                                                <th className="border dark:border-gray-700 px-4 py-3 pt-5 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium">Daft</th>
                                                <th className="border dark:border-gray-700 px-4 py-3 pt-5 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium">MyHome</th>
                                                <th className="border dark:border-gray-700 px-4 py-3 pt-5 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Inline add new row */}
                                            {adding && (
                                                <tr>
                                                    <td className="border dark:border-gray-700 px-2 py-1">
                                                        <input
                                                            name="field_name"
                                                            placeholder="Field Name"
                                                            value={form.field_name ?? ''}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                        />
                                                    </td>
                                                    <td className="border dark:border-gray-700 px-2 py-1">
                                                        <input
                                                            name="acquaint_crm"
                                                            placeholder="Acquaint CRM"
                                                            value={form.acquaint_crm ?? ''}
                                                            onChange={handleInputChange}
                                                            className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                        />
                                                    </td>
                                                    <td className="border dark:border-gray-700 px-2 py-1">
                                                        <input
                                                            name="propertydrive"
                                                            placeholder="PropertyDrive"
                                                            value={form.propertydrive ?? ''}
                                                            onChange={handleInputChange}
                                                            className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                        />
                                                    </td>
                                                    <td className="border dark:border-gray-700 px-2 py-1">
                                                        <input
                                                            name="daft"
                                                            placeholder="Daft"
                                                            value={form.daft ?? ''}
                                                            onChange={handleInputChange}
                                                            className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                        />
                                                    </td>
                                                    <td className="border dark:border-gray-700 px-2 py-1">
                                                        <input
                                                            name="myhome"
                                                            placeholder="MyHome"
                                                            value={form.myhome ?? ''}
                                                            onChange={handleInputChange}
                                                            className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                        />
                                                    </td>
                                                    <td className="border dark:border-gray-700 px-2 py-1">
                                                        <span
                                                            className="cursor-pointer text-purple-600 dark:text-purple-400 underline mr-4"
                                                            onClick={handleSubmit}
                                                            tabIndex={0}
                                                            role="button"
                                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSubmit(e as any); }}
                                                        >
                                                            Add
                                                        </span>
                                                        <span
                                                            className="cursor-pointer text-purple-600 dark:text-purple-400 underline"
                                                            onClick={() => {
                                                                setAdding(false);
                                                                setForm(emptyMapping);
                                                            }}
                                                            tabIndex={0}
                                                            role="button"
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    setAdding(false);
                                                                    setForm(emptyMapping);
                                                                }
                                                            }}
                                                        >
                                                            Cancel
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                            {mappings.map((m) => (
                                                editing && editing.id === m.id ? (
                                                    <tr key={m.id}>
                                                        <td className="border dark:border-gray-700 px-2 py-1">
                                                            <input
                                                                name="field_name"
                                                                value={form.field_name ?? ''}
                                                                onChange={handleInputChange}
                                                                required
                                                                className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                            />
                                                        </td>
                                                        <td className="border dark:border-gray-700 px-2 py-1">
                                                            <input
                                                                name="acquaint_crm"
                                                                value={form.acquaint_crm ?? ''}
                                                                onChange={handleInputChange}
                                                                className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                            />
                                                        </td>
                                                        <td className="border dark:border-gray-700 px-2 py-1">
                                                            <input
                                                                name="propertydrive"
                                                                value={form.propertydrive ?? ''}
                                                                onChange={handleInputChange}
                                                                className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                            />
                                                        </td>
                                                        <td className="border dark:border-gray-700 px-2 py-1">
                                                            <input
                                                                name="daft"
                                                                value={form.daft ?? ''}
                                                                onChange={handleInputChange}
                                                                className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                            />
                                                        </td>
                                                        <td className="border dark:border-gray-700 px-2 py-1">
                                                            <input
                                                                name="myhome"
                                                                value={form.myhome ?? ''}
                                                                onChange={handleInputChange}
                                                                className="p-2 border rounded dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 w-full"
                                                            />
                                                        </td>
                                                        <td className="border dark:border-gray-700 px-2 py-1">
                                                            <span
                                                                className="cursor-pointer text-purple-600 dark:text-purple-400 underline mr-4"
                                                                onClick={handleSubmit}
                                                                tabIndex={0}
                                                                role="button"
                                                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSubmit(e as any); }}
                                                            >
                                                                Update
                                                            </span>
                                                            <span
                                                                className="cursor-pointer text-purple-600 dark:text-purple-400 underline"
                                                                onClick={() => {
                                                                    setEditing(null);
                                                                    setForm(emptyMapping);
                                                                }}
                                                                tabIndex={0}
                                                                role="button"
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        setEditing(null);
                                                                        setForm(emptyMapping);
                                                                    }
                                                                }}
                                                            >
                                                                Cancel
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr key={m.id}>
                                                        <td className="border dark:border-gray-700 px-2 py-1 dark:text-gray-200">{m.field_name}</td>
                                                        <td className="border dark:border-gray-700 px-2 py-1 dark:text-gray-200">{m.acquaint_crm}</td>
                                                        <td className="border dark:border-gray-700 px-2 py-1 dark:text-gray-200">{m.propertydrive}</td>
                                                        <td className="border dark:border-gray-700 px-2 py-1 dark:text-gray-200">{m.daft}</td>
                                                        <td className="border dark:border-gray-700 px-2 py-1 dark:text-gray-200">{m.myhome}</td>
                                                        <td className="border dark:border-gray-700 px-2 py-1 dark:text-gray-200">
                                                            <span
                                                                className="cursor-pointer text-purple-600 dark:text-purple-400 underline mr-4"
                                                                onClick={() => handleEdit(m)}
                                                                tabIndex={0}
                                                                role="button"
                                                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleEdit(m); }}
                                                            >
                                                                Edit
                                                            </span>
                                                            <span
                                                                className="cursor-pointer text-purple-600 dark:text-purple-400 underline"
                                                                onClick={() => handleDelete(m.id)}
                                                                tabIndex={0}
                                                                role="button"
                                                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleDelete(m.id); }}
                                                            >
                                                                Delete
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            ))}
                                            {mappings.length === 0 && !adding && (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                        No field mappings found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FieldMappings;
