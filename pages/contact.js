import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // In production, connect this with backend or email API
    setSubmitted(true);
  }

  return (
    <div className="bg-gradient-to-b from-[#fffaf5] to-white min-h-screen font-[var(--font-lora)]">
      {/* ===== Header Section ===== */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 py-20 text-center">
        <h1 className="font-[var(--font-cormorant)] text-5xl sm:text-6xl font-semibold text-gray-900 mb-6">
          Contact Us
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Whether you have a question, feedback, or collaboration idea, we’d love to hear from you.  
          Reach out using the form below — our team will respond as soon as possible.
        </p>
      </section>

      {/* ===== Contact Form Section ===== */}
      <section className="mx-auto max-w-3xl px-6 sm:px-8 py-16 border-t border-neutral-200">
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white/90 backdrop-blur-sm shadow-md border rounded-3xl p-8 sm:p-10 space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                required
                value={form.message}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
                placeholder="Write your message here..."
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
            >
              Send Message
            </button>
          </form>
        ) : (
          <div className="text-center bg-white/90 border rounded-3xl shadow-md p-10 animate-ss-fade">
            <h2 className="font-[var(--font-cormorant)] text-3xl font-semibold mb-4 text-gray-900">
              Thank You
            </h2>
            <p className="text-gray-600 font-[var(--font-lora)]">
              Your message has been received. Our team will get back to you shortly.
            </p>
          </div>
        )}
      </section>

      {/* ===== Additional Info Section ===== */}
      <section className="mx-auto max-w-4xl px-6 sm:px-8 py-20 text-center border-t border-neutral-200">
        <h2 className="font-[var(--font-cormorant)] text-3xl font-semibold mb-4">
          Prefer Direct Contact?
        </h2>
        <p className="text-gray-600 mb-2">
          Email us at{" "}
          <a
            href="mailto:support@surescent.com"
            className="underline hover:text-black"
          >
            support@surescent.com
          </a>
        </p>
        <p className="text-gray-600">
          Or follow us on{" "}
          <a href="#" className="underline hover:text-black">
            Instagram
          </a>{" "}
          for the latest scent discoveries.
        </p>
      </section>
    </div>
  );
}
