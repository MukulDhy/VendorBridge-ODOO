import { addDays, subDays, formatISO } from "date-fns";

export type Role = "ADMIN" | "PROCUREMENT_OFFICER" | "MANAGER" | "VENDOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  vendorId?: string;
  avatar?: string;
}

export interface Vendor {
  id: string;
  name: string;
  gst: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: "Active" | "Inactive" | "Blacklisted";
  rating: number; // 0-5
  onTime: number; // %
  createdAt: string;
}

export interface RFQ {
  id: string;
  code: string;
  title: string;
  description: string;
  quantity: number;
  deadline: string;
  status: "Draft" | "Open" | "Closed" | "Awarded" | "Cancelled";
  createdBy: string;
  assignedVendors: string[];
  category: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  price: number;
  deliveryDays: number;
  comments: string;
  status: "Submitted" | "Shortlisted" | "Rejected" | "Awarded";
  submittedAt: string;
}

export interface Approval {
  id: string;
  rfqId: string;
  quotationId: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  remarks: string;
  approverId?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  rfqId: string;
  quotationId: string;
  vendorId: string;
  items: { name: string; qty: number; price: number }[];
  taxRate: number;
  status: "Draft" | "Issued" | "Delivered" | "Cancelled";
  createdAt: string;
  vendorName?: string;
  rfqTitle?: string;
  totalAmount?: number;
}

export interface Invoice {
  id: string;
  code: string;
  poId: string;
  vendorId: string;
  amount: number;
  taxRate: number;
  status: "Pending" | "Paid" | "Overdue";
  dueDate: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string | "all";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
}

const now = new Date();

export const seedUsers: User[] = [];
export const seedVendors: Vendor[] = [];
export const seedRFQs: RFQ[] = [];
export const seedQuotations: Quotation[] = [];
export const seedApprovals: Approval[] = [];
export const seedPOs: PurchaseOrder[] = [];
export const seedInvoices: Invoice[] = [];
export const seedNotifications: Notification[] = [];
export const seedActivity: ActivityLog[] = [];