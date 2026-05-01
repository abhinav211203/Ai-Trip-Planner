import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fff7ed_45%,#ffffff_100%)] px-6 py-14 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur md:p-10">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-900">
              Contact Us
            </span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              We would love to help with your next trip.
            </h1>
            <p className="text-base leading-7 text-slate-600 md:text-lg">
              Reach out for travel planning help, booking support, premium package questions,
              or product feedback. We will get back to you as soon as possible.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-bold text-slate-900">Get in touch</h2>
            <p className="text-sm leading-6 text-slate-600">
              Use the details below if you want to talk to us directly.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Mail className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">Email</p>
                  <p className="text-sm text-slate-600">support@aitripplanner.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Phone className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">Phone</p>
                  <p className="text-sm text-slate-600">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">Office</p>
                  <p className="text-sm text-slate-600">Bengaluru, Karnataka, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Send a message</h2>
                <p className="text-sm text-slate-600">A simple contact form for your users.</p>
              </div>
            </div>

            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                  <input
                    type="text"
                    placeholder="John"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  rows={6}
                  placeholder="Tell us how we can help you..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Send Message
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
