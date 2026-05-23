import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { orderAPI } from "@/lib/api";
import { toast } from "sonner";
import { Package, Clock, CheckCircle2, XCircle, Truck, ShoppingBag, ChevronDown, ChevronUp, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
};

type Order = {
  _id: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
  transactionId?: string;
  razorpayOrderId?: string;
};

const STATUS_CONFIG = {
  pending:   { label: "Pending",   icon: Clock,         className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle2,  className: "bg-blue-100 text-blue-800 border-blue-200" },
  delivered: { label: "Delivered", icon: Truck,         className: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", icon: XCircle,       className: "bg-red-100 text-red-800 border-red-200" },
};

const PAYMENT_CONFIG = {
  pending:   { label: "Payment Pending",   className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  completed: { label: "Paid",              className: "bg-green-50 text-green-700 border-green-200" },
  failed:    { label: "Payment Failed",    className: "bg-red-50 text-red-700 border-red-200" },
  refunded:  { label: "Refunded",          className: "bg-purple-50 text-purple-700 border-purple-200" },
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const time = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              Order <span className="font-mono text-xs text-muted-foreground">#{order._id.slice(-8).toUpperCase()}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{date} · {time}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-13 sm:ml-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.className}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </span>
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${paymentCfg.className}`}>
            {paymentCfg.label}
          </span>
          <span className="text-sm font-bold text-foreground ml-1">₹{order.total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Items preview */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        {order.items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-secondary rounded-lg px-2.5 py-1.5 text-xs text-foreground">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-5 h-5 rounded object-cover" />
            ) : (
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-medium truncate max-w-[100px]">{item.name}</span>
            <span className="text-muted-foreground">×{item.quantity}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <span className="text-xs text-muted-foreground">+{order.items.length - 3} more</span>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border-t border-border"
      >
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> View details</>}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border bg-secondary/30 p-5 space-y-4 animate-fade-in">
          {/* Items table */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Items Ordered</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 px-1 border-t border-border mt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-base font-bold text-foreground">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Delivery & Payment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Info</p>
              <p className="text-sm font-medium text-foreground">{order.customerName}</p>
              {order.customerEmail && (
                <p className="text-xs text-muted-foreground break-all">📧 {order.customerEmail}</p>
              )}
              <p className="text-xs text-muted-foreground">📞 {order.customerPhone}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">📍 {order.customerAddress}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Info</p>
              <p className="text-sm font-medium text-foreground capitalize">{order.paymentMethod.replace("_", " ")}</p>
              {order.transactionId && (
                <p className="text-xs text-muted-foreground font-mono">TXN: {order.transactionId}</p>
              )}
              {order.razorpayOrderId && (
                <p className="text-xs text-muted-foreground font-mono truncate">RZP: {order.razorpayOrderId}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!localStorage.getItem("kshira_token");

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    orderAPI
      .getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleLoginRedirect = () => {
    localStorage.setItem("kshira_oauth_redirect", "/my-orders");
    navigate("/oauth-login");
  };

  return (
    <Layout>
      <div className="container pt-32 pb-20 max-w-3xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Orders</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-13">Track and view all your past orders</p>
        </div>

        {/* Not logged in */}
        {!isLoggedIn && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
              <LogIn className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Sign in to view your orders</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Please log in with your Google account to see your order history.
            </p>
            <Button onClick={handleLoginRedirect} className="bg-gradient-to-r from-amber-400 to-amber-600 text-white mt-2">
              Sign in with Google
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoggedIn && loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-40" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-7 bg-muted rounded-lg w-28" />
                  <div className="h-7 bg-muted rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isLoggedIn && !loading && orders.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Looks like you haven't placed any orders yet. Start shopping!
            </p>
            <Button asChild className="bg-gradient-to-r from-amber-400 to-amber-600 text-white mt-2">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        )}

        {/* Orders list */}
        {isLoggedIn && !loading && orders.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""} found</p>
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
