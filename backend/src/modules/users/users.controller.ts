import { Request, Response, NextFunction } from "express";
import * as service from "./users.service";

export async function getStaffListHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await service.getStaffList();
        res.json({ data });
    } catch (err) {
        next(err);
    }
}

export async function createStaffHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await service.createStaffAccount(req.body);
        res.status(201).json({ data: user });
    } catch (err) {
        next(err);
    }
}

export async function deleteStaffHandler(req: Request, res: Response, next: NextFunction) {
    try {
        await service.removeStaffAccount(req.params.id as string, req.user!.id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}

export async function updateStaffRoleHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await service.updateStaffRole(req.params.id as string, req.body.role);
        res.json({ data: user });
    } catch (err) {
        next(err);
    }
}

export async function getProfileHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await service.getAdminProfile(req.user!.id);
        res.json({ data });
    } catch (err) {
        next(err);
    }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await service.updateAdminProfile(req.user!.id, req.body);
        res.json({ data });
    } catch (err) {
        next(err);
    }
}

export async function uploadProfilePictureHandler(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        const url = await service.uploadProfilePicture(req.user!.id, req.file);
        res.json({ data: { profile_picture_url: url } });
    } catch (err) {
        next(err);
    }
}

export async function deleteProfilePictureHandler(req: Request, res: Response, next: NextFunction) {
    try {
        await service.deleteProfilePicture(req.user!.id);
        res.json({ data: { success: true } });
    } catch (err) {
        next(err);
    }
}
