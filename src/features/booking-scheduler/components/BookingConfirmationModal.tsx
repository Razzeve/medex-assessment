"use client";

import React, { useState, useEffect } from "react";
import {
  ScheduledSlot,
  Provider,
  Specialist,
  ExistingBooking
} from "../types";
import {
  X,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  User,
  Mail,
  Phone
} from "lucide-react";
import { formatFullDisplayDate } from "../utils/slots";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: ScheduledSlot;
  provider: Provider;
  specialist: Specialist;
  groupSize: number;
  isReschedule?: boolean;
  existingBooking?: ExistingBooking | null;
  onConfirmBooking: (patientData: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  slot,
  provider,
  specialist,
  groupSize,
  isReschedule = false,
  existingBooking,
  onConfirmBooking,
  isSubmitting = false
}: BookingConfirmationModalProps) {
  const [name, setName] = useState(existingBooking?.patientName || "Somchai Prasert");
  const [email, setEmail] = useState("somchai.prasert@example.com");
  const [phone, setPhone] = useState("+66 81 234 5678");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Please fill in your name and email address.");
      return;
    }
    setFormError(null);
    await onConfirmBooking({ name, email, phone, notes });
  };

  const providerCity = provider.resolvedTimezone.split("/").pop()?.replace(/_/g, " ") || provider.name;
  const patientCity = slot.patientTime.timeZoneLabel;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h3 id="booking-modal-title" className="text-lg font-bold tracking-tight text-slate-900">
              {isReschedule ? "Confirm Appointment Reschedule" : "Confirm Appointment Booking"}
            </h3>
            <p className="text-xs text-slate-500">
              Review multi-timezone schedule and patient details before confirming.
            </p>
          </div>
        </div>

        {/* Reschedule Comparison Card if in reschedule flow */}
        {isReschedule && existingBooking && (
          <div className="mt-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Reschedule Delta Comparison:
            </span>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Previous Booking</span>
                <p className="font-bold text-rose-700 line-through mt-0.5">
                  {formatFullDisplayDate(existingBooking.date)}
                </p>
                <p className="font-mono text-slate-600 line-through">
                  {existingBooking.startTime} ({providerCity})
                </p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border-2 border-emerald-500 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> New Target Slot
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {formatFullDisplayDate(slot.date)}
                </p>
                <p className="font-mono font-bold text-teal-700">
                  {slot.startTime} – {slot.endTime} ({providerCity})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Two-Clock Appointment Highlight Box */}
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex items-center justify-between border-b border-teal-100 pb-2 mb-3">
            <div>
              <p className="font-bold text-slate-900">{specialist.name}</p>
              <p className="text-xs text-slate-600">{specialist.speciality} • {provider.name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">Party Size</span>
              <p className="text-sm font-bold text-teal-900">{groupSize} {groupSize === 1 ? "Person" : "People"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary: Provider Time */}
            <div className="rounded-lg bg-white p-3 border border-teal-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-teal-600" />
                Hospital Arrival Time ({providerCity})
              </span>
              <p className="mt-1 text-base font-extrabold text-slate-900 font-mono">
                {slot.startTime} – {slot.endTime}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                {formatFullDisplayDate(slot.date)}
              </p>
              <p className="mt-1 text-[10px] text-teal-800 font-medium">
                ★ You must be physically at the hospital by this clock.
              </p>
            </div>

            {/* Secondary: Patient Local Time */}
            <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                Your Local Time ({patientCity})
              </span>
              <p className="mt-1 text-base font-extrabold text-slate-800 font-mono">
                {slot.patientTime.startTime} – {slot.patientTime.endTime}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                {slot.patientTime.formattedDate}
              </p>
              {slot.patientTime.dateOffsetDays !== 0 && (
                <p className="mt-1 text-[10px] font-bold text-purple-700">
                  {slot.patientTime.dateOffsetDays > 0 ? "★ +1 Day ahead in your timezone" : "★ -1 Day behind in your timezone"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Patient Contact Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Somchai Prasert"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+66 81 234 5678"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical Notes / Chief Complaint (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Travel check-up, routine cardiology consultation..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Action CTAs */}
          <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isReschedule ? "Confirm Reschedule" : "Confirm Booking"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
