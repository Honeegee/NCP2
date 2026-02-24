declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: "nurse" | "admin" | "superadmin";
    };
    pagination?: {
      page: number;
      limit: number;
      offset: number;
    };
  }
}
