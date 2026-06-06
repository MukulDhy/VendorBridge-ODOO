import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import App from "../App";

function NotFoundComponent() { return null; }

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VendorBridge — Procurement ERP" },
      { name: "description", content: "Centralized procurement: RFQs, quotations, approvals, POs and invoices." },
      { property: "og:title", content: "VendorBridge — Procurement ERP" },
      { property: "og:description", content: "Centralized procurement: RFQs, quotations, approvals, POs and invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "VendorBridge — Procurement ERP" },
      { name: "twitter:description", content: "Centralized procurement: RFQs, quotations, approvals, POs and invoices." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1b5c245a-126d-4676-89b6-059920c1f558/id-preview-6aece53f--1713d014-0fd9-4abf-bb56-1cc7d0147e01.lovable.app-1780717073680.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1b5c245a-126d-4676-89b6-059920c1f558/id-preview-6aece53f--1713d014-0fd9-4abf-bb56-1cc7d0147e01.lovable.app-1780717073680.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <App />;
}
