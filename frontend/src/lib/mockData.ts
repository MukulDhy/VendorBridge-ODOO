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
  status: "Issued" | "Delivered" | "Cancelled";
  createdAt: string;
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

export const seedUsers: User[] = [
  { id: "u1", name: "Aarav Mehta", email: "admin@vendorbridge.io", role: "ADMIN", password: "admin123" },
  { id: "u2", name: "Priya Sharma", email: "officer@vendorbridge.io", role: "PROCUREMENT_OFFICER", password: "officer123" },
  { id: "u3", name: "Rohan Kapoor", email: "manager@vendorbridge.io", role: "MANAGER", password: "manager123" },
  { id: "u4", name: "Dell India Pvt Ltd", email: "vendor@dell.com", role: "VENDOR", password: "vendor123", vendorId: "v1" },
  { id: "u5", name: "HP Enterprises", email: "vendor@hp.com", role: "VENDOR", password: "vendor123", vendorId: "v2" },
];

export const seedVendors: Vendor[] = [
  { id: "v1", name: "Dell India Pvt Ltd", gst: "29ABCDE1234F2Z5", email: "vendor@dell.com", phone: "+91 9876543210", address: "Bengaluru, KA", category: "Electronics", status: "Active", rating: 4.7, onTime: 95, createdAt: formatISO(subDays(now, 120)) },
  { id: "v2", name: "HP Enterprises", gst: "27ABCDE1234F1Z9", email: "vendor@hp.com", phone: "+91 9876501234", address: "Mumbai, MH", category: "Electronics", status: "Active", rating: 4.4, onTime: 88, createdAt: formatISO(subDays(now, 110)) },
  { id: "v3", name: "Lenovo Solutions", gst: "07ABCDE5678F2Z1", email: "sales@lenovo.com", phone: "+91 9000012345", address: "Delhi, DL", category: "Electronics", status: "Active", rating: 4.5, onTime: 92, createdAt: formatISO(subDays(now, 90)) },
  { id: "v4", name: "Godrej Interio", gst: "27GODRE1234F1Z2", email: "supply@godrej.com", phone: "+91 9876123456", address: "Pune, MH", category: "Furniture", status: "Active", rating: 4.2, onTime: 84, createdAt: formatISO(subDays(now, 60)) },
  { id: "v5", name: "Reliance Office Supplies", gst: "27RELIA1234F1Z8", email: "office@reliance.com", phone: "+91 9123456780", address: "Mumbai, MH", category: "Office Supplies", status: "Inactive", rating: 3.8, onTime: 76, createdAt: formatISO(subDays(now, 200)) },
  { id: "v6", name: "Tata Steel Components", gst: "20TATAS1234F1Z3", email: "raw@tatasteel.com", phone: "+91 9000098765", address: "Jamshedpur, JH", category: "Raw Materials", status: "Active", rating: 4.8, onTime: 97, createdAt: formatISO(subDays(now, 30)) },
  { id: "v7", name: "Infosys Software Licensing", gst: "29INFOS1234F1Z6", email: "licensing@infosys.com", phone: "+91 9988776655", address: "Bengaluru, KA", category: "Software", status: "Blacklisted", rating: 2.4, onTime: 55, createdAt: formatISO(subDays(now, 300)) },
];

export const seedRFQs: RFQ[] = [
  { id: "r1", code: "RFQ-2026-001", title: "100 Developer Laptops", description: "i7, 16GB RAM, 512GB SSD, 14-inch", quantity: 100, deadline: formatISO(addDays(now, 5)), status: "Open", createdBy: "u2", assignedVendors: ["v1", "v2", "v3"], category: "Electronics", createdAt: formatISO(subDays(now, 4)) },
  { id: "r2", code: "RFQ-2026-002", title: "Ergonomic Office Chairs", description: "Mesh back, adjustable arms, lumbar support", quantity: 60, deadline: formatISO(addDays(now, 8)), status: "Open", createdBy: "u2", assignedVendors: ["v4", "v5"], category: "Furniture", createdAt: formatISO(subDays(now, 2)) },
  { id: "r3", code: "RFQ-2026-003", title: "Annual Antivirus Licenses", description: "Enterprise antivirus for 500 endpoints, 1 year", quantity: 500, deadline: formatISO(addDays(now, 3)), status: "Closed", createdBy: "u2", assignedVendors: ["v7"], category: "Software", createdAt: formatISO(subDays(now, 10)) },
  { id: "r4", code: "RFQ-2026-004", title: "MS Cold Rolled Steel Coils", description: "Grade IS513, 1.2mm thickness, 20 tonnes", quantity: 20, deadline: formatISO(addDays(now, 12)), status: "Awarded", createdBy: "u2", assignedVendors: ["v6"], category: "Raw Materials", createdAt: formatISO(subDays(now, 20)) },
  { id: "r5", code: "RFQ-2026-005", title: "Workstation Monitors 27\"", description: "4K IPS, USB-C, height-adjustable stand", quantity: 80, deadline: formatISO(addDays(now, 7)), status: "Draft", createdBy: "u2", assignedVendors: [], category: "Electronics", createdAt: formatISO(subDays(now, 1)) },
];

export const seedQuotations: Quotation[] = [
  { id: "q1", rfqId: "r1", vendorId: "v1", price: 65000, deliveryDays: 10, comments: "Includes 3-year warranty.", status: "Submitted", submittedAt: formatISO(subDays(now, 3)) },
  { id: "q2", rfqId: "r1", vendorId: "v2", price: 63000, deliveryDays: 15, comments: "Bulk discount applied.", status: "Submitted", submittedAt: formatISO(subDays(now, 2)) },
  { id: "q3", rfqId: "r1", vendorId: "v3", price: 64000, deliveryDays: 8, comments: "Free onsite setup.", status: "Shortlisted", submittedAt: formatISO(subDays(now, 2)) },
  { id: "q4", rfqId: "r2", vendorId: "v4", price: 12500, deliveryDays: 14, comments: "5-year warranty.", status: "Submitted", submittedAt: formatISO(subDays(now, 1)) },
  { id: "q5", rfqId: "r2", vendorId: "v5", price: 11800, deliveryDays: 21, comments: "Standard 1-year warranty.", status: "Submitted", submittedAt: formatISO(subDays(now, 1)) },
  { id: "q6", rfqId: "r4", vendorId: "v6", price: 78000, deliveryDays: 12, comments: "Includes transportation.", status: "Awarded", submittedAt: formatISO(subDays(now, 18)) },
];

export const seedApprovals: Approval[] = [
  { id: "a1", rfqId: "r1", quotationId: "q3", amount: 6400000, status: "Pending", remarks: "Lenovo selected on delivery + price balance.", createdAt: formatISO(subDays(now, 1)) },
  { id: "a2", rfqId: "r4", quotationId: "q6", amount: 1560000, status: "Approved", remarks: "Approved by Manager.", approverId: "u3", createdAt: formatISO(subDays(now, 19)), decidedAt: formatISO(subDays(now, 18)) },
];

export const seedPOs: PurchaseOrder[] = [
  {
    id: "p1",
    code: "PO-2026-001",
    rfqId: "r4",
    quotationId: "q6",
    vendorId: "v6",
    items: [{ name: "MS Cold Rolled Steel Coils (1 tonne)", qty: 20, price: 78000 }],
    taxRate: 18,
    status: "Delivered",
    createdAt: formatISO(subDays(now, 17)),
  },
];

export const seedInvoices: Invoice[] = [
  {
    id: "i1",
    code: "INV-2026-001",
    poId: "p1",
    vendorId: "v6",
    amount: 1840800,
    taxRate: 18,
    status: "Paid",
    dueDate: formatISO(addDays(now, 15)),
    createdAt: formatISO(subDays(now, 15)),
  },
];

export const seedNotifications: Notification[] = [
  { id: "n1", userId: "u3", title: "Approval Required", message: "RFQ-2026-001 awaiting your approval (₹64,00,000).", read: false, createdAt: formatISO(subDays(now, 1)), link: "/approvals" },
  { id: "n2", userId: "u2", title: "Quotation Received", message: "Lenovo submitted a quotation for RFQ-2026-001.", read: false, createdAt: formatISO(subDays(now, 2)), link: "/rfqs/r1" },
  { id: "n3", userId: "u4", title: "New RFQ Assigned", message: "You've been invited to quote on RFQ-2026-001.", read: true, createdAt: formatISO(subDays(now, 4)), link: "/vendor/rfqs" },
];

export const seedActivity: ActivityLog[] = [
  { id: "l1", userId: "u2", action: "CREATE_RFQ", entityType: "RFQ", entityId: "r1", timestamp: formatISO(subDays(now, 4)) },
  { id: "l2", userId: "u4", action: "SUBMIT_QUOTATION", entityType: "Quotation", entityId: "q1", timestamp: formatISO(subDays(now, 3)) },
  { id: "l3", userId: "u5", action: "SUBMIT_QUOTATION", entityType: "Quotation", entityId: "q2", timestamp: formatISO(subDays(now, 2)) },
  { id: "l4", userId: "u3", action: "APPROVE_RFQ", entityType: "Approval", entityId: "a2", timestamp: formatISO(subDays(now, 18)) },
  { id: "l5", userId: "u2", action: "GENERATE_INVOICE", entityType: "Invoice", entityId: "i1", timestamp: formatISO(subDays(now, 15)) },
];