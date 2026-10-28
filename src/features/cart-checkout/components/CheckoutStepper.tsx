import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Building,
  AlertCircle,
  RotateCw,
  ShoppingBag,
  ShieldAlert,
  User,
  MapPin,
  Mail,
  Phone,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useSplitPackages } from "../store/selectors";
import {
  CheckoutOrder,
  PatientDetails,
  PaymentMethod,
  SplitPackage,
} from "../types";
import { formatCurrency, formatSubtotals } from "../utils/currency";

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
}

export function CheckoutStepper() {
  const searchParams = useSearchParams();
  const selectedGroupParam = searchParams.get("group");

  const allPackages = useSplitPackages();
  const checkoutAll = useCartStore((state) => state.checkoutAll);
  const retryFailedGroupCheckout = useCartStore(
    (state) => state.retryFailedGroupCheckout
  );
  const checkoutSession = useCartStore((state) => state.checkoutSession);
  const orders = useCartStore((state) => state.orders);

  // Filter packages if single group checkout is requested
  const activePackages = selectedGroupParam
    ? allPackages.filter((p) => p.groupType === selectedGroupParam)
    : allPackages;

  // Step state: 1 (Breakdown) -> 2 (Patient Details) -> 3 (Payment & Order Execution)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    fullName: "Aarav Sharma",
    email: "aarav.sharma@medex.asia",
    phone: "+66 81 987 6543",
    addressLine: "124 Sukhumvit Soi 21, Asoke Tower",
    city: "Bangkok",
    postalCode: "10110",
    country: "Thailand",
    gender: "male",
    notes: "Please call upon arrival for gate security verification.",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Payment method selection per group
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({});

  // Track retry states
  const [retryingGroup, setRetryingGroup] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const getPaymentMethod = (groupType: string): PaymentMethod => {
    return paymentMethods[groupType] || "card";
  };

  const setGroupPaymentMethod = (groupType: string, method: PaymentMethod) => {
    setPaymentMethods((prev) => ({ ...prev, [groupType]: method }));
  };

  // Step 2 Form Validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!patientDetails.fullName.trim()) {
      errors.fullName = "Full patient name is required";
    }
    if (!patientDetails.email.trim() || !patientDetails.email.includes("@")) {
      errors.email = "Valid email address is required for digital receipts";
    }
    if (!patientDetails.phone.trim()) {
      errors.phone = "Phone number is required for dispatch coordination";
    }

    const needsAddress = activePackages.some(
      (p) => p.fulfillmentType === "lab_sample_collection"
    );
    if (needsAddress && !patientDetails.addressLine?.trim()) {
      errors.addressLine = "Physical dispatch address is required for home lab sample collection";
    }
    if (needsAddress && !patientDetails.city?.trim()) {
      errors.city = "City is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextFromStep1 = () => {
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    if (validateForm()) {
      setCurrentStep(3);
    }
  };

  // Step 3 Checkout All Execution
  const handleExecuteCheckout = async () => {
    const eligible = activePackages.filter((p) => p.eligibleForCheckout);
    if (eligible.length === 0) return;

    // Use selected payment method of first package as default
    const defaultMethod = getPaymentMethod(eligible[0].groupType);
    await checkoutAll(eligible, defaultMethod, patientDetails);
  };

  // Retry a failed package with same idempotency key
  const handleRetry = async (pkg: SplitPackage) => {
    setRetryingGroup(pkg.groupType);
    try {
      const method = getPaymentMethod(pkg.groupType);
      await retryFailedGroupCheckout(pkg, method, patientDetails);
    } catch {
      // Error handled by store
    } finally {
      setRetryingGroup(null);
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Check how many orders are completed for this session
  const completedOrdersList: CheckoutOrder[] = Object.values(orders);

  return (
    <div className="space-y-8">
      {/* Stepper Progress Bar */}
      <nav aria-label="Checkout Navigation" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <ol className="flex items-center justify-between sm:justify-around text-xs font-semibold">
          {/* Step 1 */}
          <li className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                currentStep > 1
                  ? "bg-teal-600 text-white"
                  : currentStep === 1
                  ? "bg-teal-600 text-white ring-4 ring-teal-100"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
            </span>
            <span className={currentStep === 1 ? "text-slate-900 font-bold" : "text-slate-500"}>
              Split Review
            </span>
          </li>

          <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

          {/* Step 2 */}
          <li className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                currentStep > 2
                  ? "bg-teal-600 text-white"
                  : currentStep === 2
                  ? "bg-teal-600 text-white ring-4 ring-teal-100"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
            </span>
            <span className={currentStep === 2 ? "text-slate-900 font-bold" : "text-slate-500"}>
              Patient & Address
            </span>
          </li>

          <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

          {/* Step 3 */}
          <li className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                currentStep === 3
                  ? "bg-teal-600 text-white ring-4 ring-teal-100"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              3
            </span>
            <span className={currentStep === 3 ? "text-slate-900 font-bold" : "text-slate-500"}>
              Payment & Confirmation
            </span>
          </li>
        </ol>
      </nav>

      {/* ============================================================ */}
      {/* STEP 1: Split Packages Breakdown Review */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Step 1: Multi-Provider Package Breakdown
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Each category is dispatched independently by accredited providers in their local currencies.
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Modify Cart Items</span>
            </Link>
          </div>

          <div className="grid gap-6">
            {activePackages.map((pkg) => {
              const subtotalList = formatSubtotals(pkg.subtotals);
              return (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{pkg.title}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {pkg.groupType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fulfillment Partner: <strong className="text-slate-700">{pkg.providerName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      <span>{pkg.estimatedTimeline}</span>
                    </div>
                  </div>

                  {/* Items Summary Table */}
                  <div className="space-y-2">
                    {pkg.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-slate-700 py-1"
                      >
                        <span className="font-medium truncate max-w-sm">
                          {item.quantity}x {item.product.title || "Service"}
                        </span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {item.product.currency}{" "}
                          {item.product.price ? item.product.price * item.quantity : "Selected Option"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal & Delivery per currency */}
                  <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
                    <span className="font-semibold text-slate-600">Settlement Total:</span>
                    <div className="flex flex-wrap gap-2">
                      {subtotalList.map(({ currency, amount }) => {
                        const fee = pkg.deliveryFees[currency] ?? 0;
                        const total = pkg.totalAmounts[currency] ?? amount;
                        return (
                          <div
                            key={currency}
                            className="rounded-md bg-white border border-slate-200 px-2.5 py-1 font-bold text-slate-900"
                          >
                            {formatCurrency(total, currency)}{" "}
                            <span className="text-[10px] font-normal text-slate-500">
                              (incl. {fee > 0 ? formatCurrency(fee, currency) : "Free"} dispatch)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <span>Continue to Patient Details</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: Patient & Fulfillment Contact Form */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Step 2: Patient Profile & Fulfillment Coordination
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Clinical results, doctor passes, and sample phlebotomists will be routed to this profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Packages</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextFromStep2();
            }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
          >
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-teal-600" />
                  Patient Full Legal Name *
                </label>
                <input
                  type="text"
                  value={patientDetails.fullName}
                  onChange={(e) =>
                    setPatientDetails({ ...patientDetails, fullName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Somchai Prasert"
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-teal-600" />
                  Email Address for Digital Pass & Reports *
                </label>
                <input
                  type="email"
                  value={patientDetails.email}
                  onChange={(e) =>
                    setPatientDetails({ ...patientDetails, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="patient@email.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Phone & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-teal-600" />
                  Phone Number (with country code) *
                </label>
                <input
                  type="tel"
                  value={patientDetails.phone}
                  onChange={(e) =>
                    setPatientDetails({ ...patientDetails, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="+66 81 234 5678"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biological Sex for Lab Reference Ranges
                </label>
                <select
                  value={patientDetails.gender}
                  onChange={(e) =>
                    setPatientDetails({
                      ...patientDetails,
                      gender: e.target.value as "male" | "female" | "other",
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address Details (for sample dispatch) */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="h-4 w-4 text-teal-600" />
                Physical Address for Diagnostic Collection & Delivery
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address & Unit / Floor
                </label>
                <input
                  type="text"
                  value={patientDetails.addressLine || ""}
                  onChange={(e) =>
                    setPatientDetails({ ...patientDetails, addressLine: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 124 Sukhumvit Soi 21"
                />
                {formErrors.addressLine && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.addressLine}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={patientDetails.city || ""}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, city: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Bangkok"
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={patientDetails.postalCode || ""}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, postalCode: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="10110"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={patientDetails.country || ""}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, country: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Thailand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Special Medical or Phlebotomist Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={patientDetails.notes || ""}
                  onChange={(e) =>
                    setPatientDetails({ ...patientDetails, notes: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Patient requires morning fasting blood draw; gate code 4092."
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back to Split Review
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <span>Proceed to Payment Review</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: Payment & Split Execution (Handles Partial Failure) */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Step 3: Multi-Package Settlement & Execution
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Configure discrete payment methods per provider. Each provider transaction is protected by an idempotency key.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Patient Profile</span>
            </button>
          </div>

          {/* Active Split Execution Cards */}
          <div className="space-y-5">
            {activePackages.map((pkg) => {
              const currentMethod = getPaymentMethod(pkg.groupType);
              const groupError = checkoutSession.checkoutErrors[pkg.groupType];
              const isRetrying = retryingGroup === pkg.groupType;

              // Check if order already completed for this package
              const completedOrder = completedOrdersList.find(
                (o) => o.groupType === pkg.groupType
              );

              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl border p-5 shadow-xs transition-all ${
                    completedOrder
                      ? "border-emerald-300 bg-emerald-50/50"
                      : groupError
                      ? "border-rose-300 bg-rose-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{pkg.title}</h4>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {pkg.groupType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Provider: <strong>{pkg.providerName}</strong>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {completedOrder ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Confirmed: #{completedOrder.orderId}</span>
                        </div>
                      ) : groupError ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
                          <ShieldAlert className="h-4 w-4 text-rose-600" />
                          <span>Checkout Failed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Ready for Settlement</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Selector if not yet ordered */}
                  {!completedOrder && (
                    <div className="mt-4 space-y-3">
                      <div className="text-xs font-semibold text-slate-700">
                        Select Payment Method for {pkg.title}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setGroupPaymentMethod(pkg.groupType, "card")}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            currentMethod === "card"
                              ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-500"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <CreditCard className={`h-5 w-5 ${currentMethod === "card" ? "text-teal-600" : "text-slate-400"}`} />
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Direct Online Card Payment
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Instant settlement in provider currency
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGroupPaymentMethod(pkg.groupType, "pay_at_clinic")}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            currentMethod === "pay_at_clinic"
                              ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-500"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <Building className={`h-5 w-5 ${currentMethod === "pay_at_clinic" ? "text-teal-600" : "text-slate-400"}`} />
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Pay in Person at Clinic
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Settle upon arrival or sample collection
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Partial Failure Alert with Retry Action */}
                  {groupError && !completedOrder && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-bold text-rose-950">
                              Package Settlement Failed
                            </h5>
                            <p className="text-xs text-rose-800 mt-0.5">{groupError}</p>
                            <p className="text-[11px] text-rose-700 mt-1">
                              Other successful orders are safe and will not be re-billed. Retrying uses the original idempotency key to prevent double charges.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRetry(pkg)}
                          disabled={isRetrying}
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 disabled:opacity-50 transition-colors"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                          <span>{isRetrying ? "Retrying..." : "Retry This Order"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Completed Receipt Card */}
                  {completedOrder && (
                    <div className="mt-4 rounded-xl bg-white border border-emerald-200 p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">MedEx Order Reference:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span>{completedOrder.orderId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderId(completedOrder.orderId)}
                            className="p-1 hover:text-teal-600"
                            title="Copy Order Reference"
                          >
                            {copiedOrderId === completedOrder.orderId ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Payment Method:</span>
                        <span className="font-semibold text-slate-900 capitalize">
                          {completedOrder.paymentMethod.replace("_", " ")} ({completedOrder.status})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Patient:</span>
                        <span className="font-semibold text-slate-900">
                          {completedOrder.patientDetails.fullName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Reload Safety: If you refresh this page, completed orders and active transactions are preserved.
            </div>

            <div className="flex items-center gap-3">
              {activePackages.some((p) => p.eligibleForCheckout && !orders[p.id]) ? (
                <button
                  type="button"
                  onClick={handleExecuteCheckout}
                  disabled={checkoutSession.isCheckingOut}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {checkoutSession.isCheckingOut ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Executing Multi-Provider Orders...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Pay All Eligible Packages</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ShoppingBag className="h-4 w-4 text-teal-600" />
                  <span>Return to Healthcare Cart</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
