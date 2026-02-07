// PayItemListPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    createPayItem,
    updatePayItem,
    deletePayItem,
    getAllPayItems,
} from "../actions/payitemactions";
import { toast } from "sonner";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue
} from "@/components/ui/select";
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'

interface PayItem {
    id: number;
    title: string;
    type: string;
    mode: string;
    defaultAmount: number;
}

// Form type excludes `id`
type PayItemForm = Omit<PayItem, "id">;

export default function PayItemListPage() {
    const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
    const [items, setItems] = useState<PayItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<PayItem | null>(null);

    const [form, setForm] = useState<PayItemForm>({
        title: "",
        type: "ALLOWANCE",
        mode: "FIXED",
        defaultAmount: 0,
    });

    const fetchItems = async () => {
        try {
            const data = await getAllPayItems();
            setItems(data || []);
        } catch (err) {
            toast.error("Failed to fetch pay items");
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const openCreate = () => {
        setForm({ title: "", type: "ALLOWANCE", mode: "FIXED", defaultAmount: 0 });
        setEditItem(null);
        setModalOpen(true);
    };

    const openEdit = (item: PayItem) => {
        const { id, ...rest } = item;
        setForm(rest);
        setEditItem(item);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let res;
            if (editItem) {
                res = await updatePayItem(editItem.id, form);
            } else {
                res = await createPayItem(form);
            }

            if (!res?.success) {
                toast.error(res.message || "Error");
                return;
            }

            toast.success(res.message);
            setModalOpen(false);
            fetchItems();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showYesNoDialog({
            title: 'Delete PayItem',
            content: (
                <div>
                    Are you sure you want to delete selected payitem
                    This action{' '}
                    <span className="text-red-500 font-semibold">cannot</span> be undone.
                </div>
            ),
        })
        if (!confirmed) return

        const res = await deletePayItem(id);

        if (res.success) {
            toast.success("Deleted");
            fetchItems();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Pay Items</h1>
                <Button onClick={openCreate}>Add Pay Item</Button>
            </div>

            {/* List */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y">
                {items.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        No pay items found.
                    </div>
                )}

                {items.map((item, idx) => (
                    <div
                        key={item.id}
                        className={`p-4 flex justify-between items-center ${idx % 2 === 0
                                ? "bg-gray-100 dark:bg-gray-900"
                                : "bg-white dark:bg-gray-800"
                            } hover:bg-gray-50 dark:hover:bg-gray-700 transition`}
                    >
                        <div className="flex flex-col">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {item.type} — {item.mode} — {item.defaultAmount}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEdit(item)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="font-semibold">
                            {editItem ? "Edit Pay Item" : "Create Pay Item"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div className="space-y-1">
                            <Label>Title</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Type</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) =>
                                    setForm({ ...form, type: v as "ALLOWANCE" | "DEDUCTION" })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALLOWANCE">Allowance</SelectItem>
                                    <SelectItem value="DEDUCTION">Deduction</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>


                        <div className="space-y-1">
                            <Label>Mode</Label>
                            <Select
                                value={form.mode}
                                onValueChange={(v) =>
                                    setForm({ ...form, mode: v as "FIXED" | "PERCENTAGE" })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXED">Fixed</SelectItem>
                                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>


                        <div className="space-y-1">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                value={form.defaultAmount}
                                onChange={(e) =>
                                    setForm({ ...form, defaultAmount: Number(e.target.value) })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Saving..." : editItem ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {YesNoDialog}
        </div>
    );
}
