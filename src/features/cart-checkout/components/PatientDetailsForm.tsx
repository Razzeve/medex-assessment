import React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  HeartPulse,
  FileText,
  ArrowRight,
  ArrowLeft,
  Truck,
  Activity,
} from "lucide-react";
import { PatientDetails, SplitPackage } from "../types";

export interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
}

interface PatientDetailsFormProps {
  patientDetails: PatientDetails;
  onChange: (details: PatientDetails) => void;
  errors: FormErrors;
  activePackages: SplitPackage[];
  onSubmit: () => void;
  onBack: () => void;
}

export function PatientDetailsForm({
  patientDetails,
  onChange,
  errors,
  activePackages,
  onSubmit,
  onBack,
}: PatientDetailsFormProps) {
  const hasPhysicalItems = activePackages.some(
    (p) =>
      p.fulfillmentType === "lab_sample_collection" ||
      p.groupType === "lab_test"
  );

  const hasLabOrConsultation = activePackages.some(
    (p) =>
      p.groupType === "lab_test" ||
      p.groupType === "package" ||
      p.groupType === "service" ||
      p.groupType === "wellness"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Dynamic Requirements Notice Banners */}
      <div className="flex flex-wrap gap-2.5">
        {hasPhysicalItems && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800">
            <Truck className="h-3.5 w-3.5 text-blue-600" />
            <span>Delivery Address Required for Sample Collection</span>
          </div>
        )}
        {hasLabOrConsultation && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-800">
            <Activity className="h-3.5 w-3.5 text-teal-600" />
            <span>DOB &amp; Biological Sex Required for Lab Reference Ranges</span>
          </div>
        )}
      </div>

      {/* Section 1: Patient Legal Identity & Contact */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-4 w-4 text-teal-600" />
          Patient &amp; Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="field-fullName"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Patient Legal Full Name *
            </label>
            <input
              id="field-fullName"
              type="text"
              value={patientDetails.fullName}
              onChange={(e) =>
                onChange({ ...patientDetails, fullName: e.target.value })
              }
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "error-fullName" : undefined}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                errors.fullName
                  ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-300 bg-white focus:border-teal-500 focus:ring-teal-500/20"
              }`}
              placeholder="e.g. Somchai Prasert"
            />
            {errors.fullName && (
              <p id="error-fullName" className="mt-1 text-xs text-rose-600 font-medium">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="field-email"
              className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
            >
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email Address (for passes &amp; receipts) *
            </label>
            <input
              id="field-email"
              type="email"
              value={patientDetails.email}
              onChange={(e) =>
                onChange({ ...patientDetails, email: e.target.value })
              }
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "error-email" : undefined}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-300 bg-white focus:border-teal-500 focus:ring-teal-500/20"
              }`}
              placeholder="patient@medex.asia"
            />
            {errors.email && (
              <p id="error-email" className="mt-1 text-xs text-rose-600 font-medium">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label
              htmlFor="field-phone"
              className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Contact Phone (with country code) *
            </label>
            <input
              id="field-phone"
              type="tel"
              value={patientDetails.phone}
              onChange={(e) =>
                onChange({ ...patientDetails, phone: e.target.value })
              }
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "error-phone" : undefined}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                errors.phone
                  ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-300 bg-white focus:border-teal-500 focus:ring-teal-500/20"
              }`}
              placeholder="+66 81 234 5678"
            />
            {errors.phone && (
              <p id="error-phone" className="mt-1 text-xs text-rose-600 font-medium">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Date of Birth (Required for Lab / Consultations) */}
          <div>
            <label
              htmlFor="field-dob"
              className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Date of Birth {hasLabOrConsultation ? "*" : "(Optional)"}
            </label>
            <input
              id="field-dob"
              type="date"
              value={patientDetails.dateOfBirth || ""}
              onChange={(e) =>
                onChange({ ...patientDetails, dateOfBirth: e.target.value })
              }
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? "error-dob" : undefined}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                errors.dateOfBirth
                  ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-300 bg-white focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            {errors.dateOfBirth && (
              <p id="error-dob" className="mt-1 text-xs text-rose-600 font-medium">
                {errors.dateOfBirth}
              </p>
            )}
          </div>
        </div>

        {/* Biological Sex */}
        <div>
          <label
            htmlFor="field-gender"
            className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
          >
            <HeartPulse className="h-3.5 w-3.5 text-slate-400" />
            Biological Sex for Lab Reference Ranges {hasLabOrConsultation ? "*" : ""}
          </label>
          <select
            id="field-gender"
            value={patientDetails.gender || "male"}
            onChange={(e) =>
              onChange({
                ...patientDetails,
                gender: e.target.value as "male" | "female" | "other",
              })
            }
            aria-invalid={!!errors.gender}
            aria-describedby={errors.gender ? "error-gender" : undefined}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
          {errors.gender && (
            <p id="error-gender" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.gender}
            </p>
          )}
        </div>
      </div>

      {/* Section 2: Physical Delivery Address (Mandatory for Lab Collection / Courier) */}
      <div className="border-t border-slate-100 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-teal-600" />
            Physical Address {hasPhysicalItems ? "(Sample Collection Destination) *" : "(Optional)"}
          </h3>
          {hasPhysicalItems && (
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Required for phlebotomist visit
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="field-address"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            Street Address &amp; Unit / Floor {hasPhysicalItems ? "*" : ""}
          </label>
          <input
            id="field-address"
            type="text"
            value={patientDetails.addressLine || ""}
            onChange={(e) =>
              onChange({ ...patientDetails, addressLine: e.target.value })
            }
            aria-invalid={!!errors.addressLine}
            aria-describedby={errors.addressLine ? "error-address" : undefined}
            className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
              errors.addressLine
                ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-slate-300 bg-white focus:border-teal-500 focus:ring-teal-500/20"
            }`}
            placeholder="e.g. 124 Sukhumvit Soi 21, Asoke Tower"
          />
          {errors.addressLine && (
            <p id="error-address" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.addressLine}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="field-city"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              City {hasPhysicalItems ? "*" : ""}
            </label>
            <input
              id="field-city"
              type="text"
              value={patientDetails.city || ""}
              onChange={(e) =>
                onChange({ ...patientDetails, city: e.target.value })
              }
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? "error-city" : undefined}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                errors.city
                  ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-300 bg-white focus:border-teal-500 focus:ring-teal-500/20"
              }`}
              placeholder="Bangkok"
            />
            {errors.city && (
              <p id="error-city" className="mt-1 text-xs text-rose-600 font-medium">
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-postal"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Postal Code
            </label>
            <input
              id="field-postal"
              type="text"
              value={patientDetails.postalCode || ""}
              onChange={(e) =>
                onChange({ ...patientDetails, postalCode: e.target.value })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="10110"
            />
          </div>

          <div>
            <label
              htmlFor="field-country"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Country
            </label>
            <input
              id="field-country"
              type="text"
              value={patientDetails.country || ""}
              onChange={(e) =>
                onChange({ ...patientDetails, country: e.target.value })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="Thailand"
            />
          </div>
        </div>

        {/* Special Clinical Notes */}
        <div>
          <label
            htmlFor="field-notes"
            className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Special Instructions for Medical Team or Phlebotomist (Optional)
          </label>
          <textarea
            id="field-notes"
            rows={2}
            value={patientDetails.notes || ""}
            onChange={(e) =>
              onChange({ ...patientDetails, notes: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="e.g. Fasting sample requested for morning draw; building buzzer code 204."
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-5 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Package Review</span>
        </button>

        <button
          type="submit"
          className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <span>Continue to Payment Review</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

