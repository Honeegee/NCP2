"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import type { AdminProfile } from "@/types";

interface AdminProfileEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: AdminProfile;
    onSave: (data: {
        first_name: string;
        last_name: string;
        phone: string;
    }) => Promise<void>;
}

export default function AdminProfileEditModal({
    open,
    onOpenChange,
    profile,
    onSave,
}: AdminProfileEditModalProps) {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        phone: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                phone: profile.phone || "",
            });
        }
    }, [open, profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(form);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Admin Profile</DialogTitle>
                    <DialogDescription>
                        Update your personal information for your administrative account.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className="text-foreground">First Name</Label>
                            <Input
                                id="first_name"
                                value={form.first_name}
                                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                className="h-11 bg-muted/50 border-border rounded-xl text-foreground"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name" className="text-foreground">Last Name</Label>
                            <Input
                                id="last_name"
                                value={form.last_name}
                                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                className="h-11 bg-muted/50 border-border rounded-xl text-foreground"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                        <Input
                            id="phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+63 XXX XXX XXXX"
                            className="h-11 bg-muted/50 border-border rounded-xl text-foreground"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary rounded-xl font-bold px-6"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
