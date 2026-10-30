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
  ShieldCheck,
  Package,
  Layers,
} from "lucide-react";
import { useCartStore } from "../store/use-cart-store";
import { useSplitPackages } from "../store/selectors";
import {
  CheckoutOrder,
  PatientDetails,
  PaymentMethod,
  SplitPackage,
} from "../types";
import { formatCurrency, formatSubtotals } from "../utils/currency";
import { PatientDetailsForm, FormErrors } from "./patient-details-form";
import { PaymentConfirmation } from "./payment-confirmation";

export function CheckoutStepper() {
  const searchParams = useSearchParams();
  const selectedGroupParam = searchParams.get("group");

  const allPackages = useSplitPackages();
  const checkoutAll = useCartStore((state) => state.checkoutAll);
  const checkoutGroup = useCartStore((state) => state.checkoutGroup);
  const retryFailedGroupCheckout = useCartStore(
    (state) => state.retryFailedGroupCheckout
  );
  const checkoutSession = useCartStore((state) => state.checkoutSession);

  // Filter packages if single group checkout is requested
  const activePackages = selectedGroupParam
    ? allPackages.filter((p) => p.groupType === selectedGroupParam)
    : allPackages;

  const isolatedPackage = selectedGroupParam
    ? allPackages.find((p) => p.groupType === selectedGroupParam)
    : null;

  // Step state: 1 (Review) -> 2 (Patient Details) -> 3 (Payment) -> Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSuccessView, setIsSuccessView] = useState(false);
  const [placedOrders, setPlacedOrders] = useState<CheckoutOrder[]>([]);

  const [isExecutingOrder, setIsExecutingOrder] = useState(false);

  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    fullName: "Aarav Sharma",
    email: "aarav.sharma@medex.asia",
    phone: "+66 81 987 6543",
    addressLine: "124 Sukhumvit Soi 21, Asoke Tower",
    city: "Bangkok",
    postalCode: "10110",
    country: "Thailand",
    dateOfBirth: "1990-05-14",
    gender: "male",
    notes: "Please call upon arrival for gate security verification.",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({});

  const [selectedReviewTab, setSelectedReviewTab] = useState<string>("all");

  const [retryingGroup, setRetryingGroup] = useState<string | null>(null);

  const getPaymentMethod = (groupType: string): PaymentMethod => {
    return paymentMethods[groupType] || "card";
  };

  const setGroupPaymentMethod = (groupType: string, method: PaymentMethod) => {
    setPaymentMethods((prev) => ({ ...prev, [groupType]: method }));
  };

  // Validate required patient details based on package fulfillment type
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!patientDetails.fullName?.trim()) {
      errors.fullName = "Patient full legal name is required";
    }

    if (!patientDetails.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientDetails.email)) {
      errors.email = "Valid email address is required for digital receipts and passes";
    }

    if (!patientDetails.phone?.trim()) {
      errors.phone = "Phone number is required for dispatch & appointment confirmation";
    }

    // 2. Physical Items Validation (Dispatch Address)
    const hasPhysical = activePackages.some(
      (p) =>
        p.fulfillmentType === "lab_sample_collection" ||
        p.groupType === "lab_test"
    );

    if (hasPhysical) {
      if (!patientDetails.addressLine?.trim()) {
        errors.addressLine = "Physical dispatch address is required for home sample collection";
      }
      if (!patientDetails.city?.trim()) {
        errors.city = "City is required for courier & phlebotomist routing";
      }
    }

    // 3. Lab / Clinical Consultation Items (DOB & Gender for reference ranges)
    const hasLabOrConsultation = activePackages.some(
      (p) =>
        p.groupType === "lab_test" ||
        p.groupType === "package" ||
        p.groupType === "service" ||
        p.groupType === "wellness"
    );

    if (hasLabOrConsultation) {
      if (!patientDetails.dateOfBirth?.trim()) {
        errors.dateOfBirth = "Date of Birth is required for clinical reference ranges";
      }
      if (!patientDetails.gender) {
        errors.gender = "Biological sex is required for medical evaluation";
      }
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

  // Execute checkout settlement across active packages
  const handleExecuteCheckout = async () => {
    const eligible = activePackages.filter((p) => p.eligibleForCheckout);
    if (eligible.length === 0) return;

    setIsExecutingOrder(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (isolatedPackage) {
        const method = getPaymentMethod(isolatedPackage.groupType);
        const order = await checkoutGroup(isolatedPackage, method, patientDetails);
        setPlacedOrders([order]);
        setIsSuccessView(true);
      } else {
        const defaultMethod = getPaymentMethod(eligible[0].groupType);
        const { succeeded } = await checkoutAll(eligible, defaultMethod, patientDetails);
        if (succeeded.length > 0) {
          setPlacedOrders(succeeded);
          setIsSuccessView(true);
        }
      }
    } catch {
    } finally {
      setIsExecutingOrder(false);
    }
  };

  const handleRetry = async (pkg: SplitPackage) => {
    setRetryingGroup(pkg.groupType);
    try {
      const method = getPaymentMethod(pkg.groupType);
      const order = await retryFailedGroupCheckout(pkg, method, patientDetails);
      setPlacedOrders((prev) => [...prev, order]);
    } catch {
    } finally {
      setRetryingGroup(null);
    }
  };

  if (isSuccessView && placedOrders.length > 0) {
    const remainingCount = allPackages.filter(
      (p) => !placedOrders.some((o) => o.groupType === p.groupType)
    ).length;

    return (
      <PaymentConfirmation
        orders={placedOrders}
        remainingPackagesCount={remainingCount}
      />
    );
  }

  if (selectedGroupParam && activePackages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Package &ldquo;{selectedGroupParam}&rdquo; Not Found in Cart
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          This fulfillment package may have already been ordered or removed from your cart.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/checkout"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            <Layers className="h-4 w-4" />
            <span>Checkout All Active Packages</span>
          </Link>
          <Link
            href="/cart"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Return to Cart</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Group Isolation Banner when ?group=[id] is active */}
      {isolatedPackage && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                  Checking out:
                </span>
                <span className="text-sm font-bold text-teal-900">
                  {isolatedPackage.title}
                </span>
              </div>
              <p className="text-xs text-teal-700 mt-0.5">
                Provider: <strong>{isolatedPackage.providerName}</strong> • Other packages remain safely in your cart.
              </p>
            </div>
          </div>

          <Link
            href="/checkout"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-4 py-2 text-xs font-bold text-teal-800 shadow-2xs hover:bg-teal-50 transition-colors shrink-0"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Checkout All Packages</span>
          </Link>
        </div>
      )}

      <nav
        aria-label="Checkout Progress Navigation"
        className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs"
      >
        {/* Mobile View: Compact dots & current step label (< 640px) */}
        <div className="flex sm:hidden items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-2xs">
              {currentStep}
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Step {currentStep} of 3
              </div>
              <div className="text-xs font-bold text-slate-900">
                {currentStep === 1
                  ? "Split Package Review"
                  : currentStep === 2
                  ? "Patient & Delivery Details"
                  : "Payment & Confirmation"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2.5 rounded-full transition-all ${
                  step === currentStep
                    ? "w-6 bg-teal-600"
                    : step < currentStep
                    ? "w-2.5 bg-teal-400"
                    : "w-2.5 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop / Tablet View: Full Step Indicators (>= 640px) */}
        <ol className="hidden sm:flex items-center justify-between text-xs font-semibold">
          <li className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
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

          <div className="h-0.5 flex-1 max-w-[80px] bg-slate-200 mx-2" />

          <li className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
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
              Patient &amp; Delivery
            </span>
          </li>

          <div className="h-0.5 flex-1 max-w-[80px] bg-slate-200 mx-2" />

          <li className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 3
                  ? "bg-teal-600 text-white ring-4 ring-teal-100"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              3
            </span>
            <span className={currentStep === 3 ? "text-slate-900 font-bold" : "text-slate-500"}>
              Payment &amp; Confirmation
            </span>
          </li>
        </ol>
      </nav>

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Step 1: Multi-Provider Package Breakdown
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Each provider fulfills orders autonomously in their local currency.
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Modify Cart Items</span>
            </Link>
          </div>

          {!selectedGroupParam && activePackages.length > 1 && (
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setSelectedReviewTab("all")}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  selectedReviewTab === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Packages ({activePackages.length})
              </button>
              {activePackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedReviewTab(pkg.groupType)}
                  className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    selectedReviewTab === pkg.groupType
                      ? "bg-teal-600 text-white shadow-xs font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pkg.badgeLabel}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-6">
            {activePackages
              .filter(
                (pkg) =>
                  selectedReviewTab === "all" ||
                  selectedReviewTab === pkg.groupType ||
                  selectedGroupParam
              )
              .map((pkg) => {
                const subtotalList = formatSubtotals(pkg.subtotals);

                return (
                  <div
                    key={pkg.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{pkg.title}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {pkg.groupType.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Fulfillment Partner: <strong className="text-slate-800">{pkg.providerName}</strong>
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                        <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{pkg.estimatedTimeline}</span>
                      </div>
                    </div>

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
                            {item.product.price
                              ? formatCurrency(
                                  item.product.price * item.quantity,
                                  item.product.currency || "THB"
                                )
                              : "Selected Option"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
                      <span className="font-semibold text-slate-600">Settlement Total:</span>
                      <div className="flex flex-wrap gap-2">
                        {subtotalList.map(({ currency, amount }) => {
                          const fee = pkg.deliveryFees[currency] ?? 0;
                          const total = pkg.totalAmounts[currency] ?? amount;
                          return (
                            <div
                              key={currency}
                              className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 font-bold text-slate-900 shadow-2xs"
                            >
                              {formatCurrency(total, currency)}{" "}
                              <span className="text-[11px] font-normal text-slate-500">
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
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <span>Continue to Patient Details</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Step 2: Patient Profile &amp; Fulfillment Coordination
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Clinical passes, doctor passes, and sample dispatch will be registered to this profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Packages</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <PatientDetailsForm
              patientDetails={patientDetails}
              onChange={setPatientDetails}
              errors={formErrors}
              activePackages={activePackages}
              onSubmit={handleNextFromStep2}
              onBack={() => setCurrentStep(1)}
            />
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Step 3: Multi-Package Settlement &amp; Execution
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Configure payment method per provider. Each transaction is protected by idempotency.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Patient Profile</span>
            </button>
          </div>

          <div className="space-y-5">
            {activePackages.map((pkg) => {
              const currentMethod = getPaymentMethod(pkg.groupType);
              const groupError = checkoutSession.checkoutErrors[pkg.groupType];
              const isRetrying = retryingGroup === pkg.groupType;

              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl border p-5 shadow-xs transition-all ${
                    groupError
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

                    <div>
                      {groupError ? (
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

                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-700">
                      Select Payment Method for {pkg.title}:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGroupPaymentMethod(pkg.groupType, "card")}
                        className={`flex min-h-[44px] items-center gap-3 rounded-xl border p-3 text-left transition-all ${
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
                        className={`flex min-h-[44px] items-center gap-3 rounded-xl border p-3 text-left transition-all ${
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

                  {groupError && (
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
                              Other successful orders are safe. Retrying reuses the idempotency key.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRetry(pkg)}
                          disabled={isRetrying}
                          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 disabled:opacity-50 transition-colors"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                          <span>{isRetrying ? "Retrying..." : "Retry This Order"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer with Realistic Simulated Loading Spinner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Reload Safety: Completed orders and active sessions are preserved across browser refreshes.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExecuteCheckout}
                disabled={isExecutingOrder || checkoutSession.isCheckingOut}
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-teal-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 active:scale-[0.99]"
              >
                {isExecutingOrder || checkoutSession.isCheckingOut ? (
                  <>
                    <RotateCw className="h-5 w-5 animate-spin" />
                    <span>Processing Orders with Local Providers...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {isolatedPackage
                        ? `Place Order for ${isolatedPackage.title}`
                        : `Confirm & Pay All Eligible Packages (${activePackages.length})`}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
