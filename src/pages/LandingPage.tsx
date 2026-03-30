import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  MapPin,
  Plane,
  QrCode,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLineLoginUrl } from "@/contexts/LineAuthContext";

const quickProof = [
  "ไม่ต้องโหลดแอปเพิ่ม",
  "เข้าได้ทันทีด้วย LINE",
  "สรุปว่าใครต้องโอนใครให้อัตโนมัติ",
];

const destinations = [
  "Tokyo",
  "Osaka",
  "Seoul",
  "Taipei",
  "Hong Kong",
  "London",
  "Bali",
  "Bangkok",
];

const proofPoints = [
  {
    title: "เปิดทริปในแชตเดียว",
    body: "สร้างทริป ส่งลิงก์หรือ QR เข้า LINE แล้วเริ่มแชร์ค่าใช้จ่ายได้เลย",
    icon: QrCode,
  },
  {
    title: "ทุกคนเห็นยอดเดียวกัน",
    body: "ค่าแท็กซี่ ค่าโรงแรม ค่าอาหาร ถูกอัปเดตกลางทริปแบบไม่ต้องไล่ทวง",
    icon: ReceiptText,
  },
  {
    title: "จบทริปด้วยยอดโอนที่สั้นที่สุด",
    body: "ระบบรวมยอดให้อัตโนมัติ เหลือแค่ใครต้องโอนใครจริง ๆ",
    icon: Wallet,
  },
];

const flowSteps = [
  {
    title: "ล็อกอินด้วย LINE",
    body: "เข้าใช้งานเร็ว ไม่ต้องสมัครใหม่",
  },
  {
    title: "แชร์ให้เพื่อนเข้าทริป",
    body: "ส่งลิงก์หรือ QR แล้วเริ่มหารได้ทันที",
  },
  {
    title: "เพิ่มรายจ่ายแล้วดูยอดโอน",
    body: "ทุกคนเห็นภาพรวมเดียวกันตลอดทริป",
  },
];

const mapPins = [
  { name: "London", top: "22%", left: "14%" },
  { name: "Bangkok", top: "54%", left: "72%" },
  { name: "Tokyo", top: "38%", left: "83%" },
  { name: "Seoul", top: "35%", left: "79%" },
  { name: "Bali", top: "67%", left: "76%" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4efe5] text-slate-950">
      <div className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_28%),linear-gradient(135deg,_#f8f1e6_0%,_#efe1ca_48%,_#d8d8c9_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.24),transparent_34%,rgba(15,23,42,0.05)_74%,transparent_100%)]" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ffdb98]/55 blur-3xl" />
        <div className="absolute right-[-5rem] top-[-4rem] h-80 w-80 rounded-full bg-[#6ec8a7]/25 blur-3xl" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">
              TripSplit
            </div>
            <div className="mt-1 text-sm text-slate-500">หารเงินทริปผ่าน LINE แบบจบจริง</div>
          </div>
          <a href={getLineLoginUrl()}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-slate-300 bg-white/75 px-5 text-slate-700 backdrop-blur"
            >
              เข้าสู่ระบบ
            </Button>
          </a>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100svh-92px)] w-full max-w-7xl items-center gap-14 px-6 pb-16 pt-4 md:px-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:pb-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 shadow-[0_12px_40px_rgba(148,163,184,0.14)] backdrop-blur">
              <Plane className="h-3.5 w-3.5 text-emerald-600" />
              ใช้งานจริงในทริปที่คนแชร์ค่าใช้จ่ายกันทุกวัน
            </div>

            <h1 className="mt-7 max-w-xl text-[3.45rem] font-semibold leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-[5.75rem]">
              หารเงินทริป
              <br />
              ให้จบอย่างสบาย
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-slate-600 md:mt-6 md:text-[1.05rem]">
              เปิดด้วย LINE เพิ่มรายจ่ายระหว่างทาง แล้วรู้ทันทีว่าใครต้องโอนใครก่อนทริปจบ
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <a href={getLineLoginUrl()}>
                <Button className="h-14 rounded-full bg-[#06c755] px-7 text-base font-semibold text-white shadow-[0_18px_40px_rgba(6,199,85,0.28)] transition-transform hover:scale-[1.01] hover:bg-[#05b64d]">
                  เริ่มทริปด้วย LINE
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link to="/app">
                <Button
                  variant="ghost"
                  className="h-14 rounded-full px-5 text-sm font-medium text-slate-600 hover:bg-white/60 hover:text-slate-950"
                >
                  ดูเวอร์ชันทดลอง
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
              {quickProof.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 shadow-[0_10px_30px_rgba(148,163,184,0.12)] backdrop-blur"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-slate-900/10 pt-6">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                จุดหมายที่เห็นการใช้งานบ่อย
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {destinations.map((destination) => (
                  <span
                    key={destination}
                    className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1.5 text-sm text-slate-700"
                  >
                    {destination}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="relative overflow-hidden rounded-[2.15rem] border border-white/60 bg-[#09243a] p-4 shadow-[0_45px_120px_rgba(15,23,42,0.26)] sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(135,206,235,0.2),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

              <div className="relative rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#103658_0%,#071a2a_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.3em] text-white/55">
                      Live trip activity
                    </div>
                    <div className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em]">
                      ค่าใช้จ่ายกำลังถูกแชร์อยู่บนหลายเส้นทาง
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-2 text-sm text-white/78">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    พร้อมแชร์เข้า LINE
                  </div>
                </div>

                <div className="relative mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,45,72,0.95),rgba(6,22,35,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
                  <div className="pointer-events-none absolute inset-x-6 top-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-8 bottom-12 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-6 left-[28%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-10 right-[24%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                  <svg
                    viewBox="0 0 800 480"
                    className="h-[340px] w-full rounded-[1.2rem] bg-[radial-gradient(circle_at_50%_30%,rgba(80,179,255,0.1),transparent_34%),linear-gradient(180deg,#0c2d48_0%,#082033_100%)] sm:h-[420px]"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f8d26a" stopOpacity="0.25" />
                        <stop offset="50%" stopColor="#c2ff80" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#6ce5ff" stopOpacity="0.35" />
                      </linearGradient>
                      <radialGradient id="pinHalo" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#d7fff0" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#d7fff0" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <g fill="#2f6d82" opacity="0.92">
                      <path d="M76 143c32-22 88-42 133-41 36 1 84 22 108 46 22 22 15 47-18 54-27 6-42 14-54 31-10 16-33 25-65 25-47 0-132-24-159-51-20-21-9-45 55-64Z" />
                      <path d="M255 270c18-20 44-35 73-39 42-6 105 5 137 24 26 15 43 39 39 57-6 25-46 31-91 15-31-11-51-7-74 13-22 19-58 28-96 20-47-9-63-45-30-90 9-12 24-24 42-36Z" />
                      <path d="M428 110c25-24 72-46 118-51 63-7 141 11 177 41 35 30 24 67-32 81-34 9-52 20-63 39-16 29-48 39-109 35-47-4-85-18-111-43-20-19-28-41-21-59 6-15 19-30 41-43Z" />
                      <path d="M520 236c22-14 53-23 79-22 34 2 91 25 120 49 36 31 39 69 6 88-29 16-62 18-99 4-28-10-42-9-61 7-16 13-41 20-69 19-37-2-65-17-72-41-10-30 17-75 58-104 11-8 25-16 38-20Z" />
                      <path d="M643 348c24-18 56-27 87-24 32 2 62 17 79 39 18 23 17 47-2 61-22 16-63 14-92-4-24-15-36-16-53-3-19 14-43 19-66 14-24-5-39-20-39-40 0-17 11-33 33-47 15-9 33-17 53-21Z" />
                    </g>

                    <g fill="none" stroke="url(#routeGlow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M151 110C249 72 350 72 478 116S703 168 682 220" />
                      <path d="M478 116C562 152 618 210 640 280" />
                      <path d="M478 116C532 177 571 228 603 364" />
                    </g>

                    <g fill="#ffe6a8">
                      <circle cx="151" cy="110" r="7" />
                      <circle cx="478" cy="116" r="8" />
                      <circle cx="640" cy="280" r="8" />
                      <circle cx="603" cy="364" r="7" />
                      <circle cx="682" cy="220" r="6" />
                    </g>

                    <g fill="url(#pinHalo)">
                      <circle cx="151" cy="110" r="26" />
                      <circle cx="478" cy="116" r="30" />
                      <circle cx="640" cy="280" r="28" />
                      <circle cx="603" cy="364" r="24" />
                    </g>
                  </svg>

                  <div className="absolute right-5 top-5 rounded-full border border-white/12 bg-slate-950/55 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.26em] text-white/65 backdrop-blur">
                    Asia to Europe
                  </div>

                  {mapPins.map((pin) => (
                    <div
                      key={pin.name}
                      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/12 bg-slate-950/65 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_10px_25px_rgba(15,23,42,0.28)] backdrop-blur"
                      style={{ top: pin.top, left: pin.left }}
                    >
                      <MapPin className="h-3 w-3 text-[#ff8f66]" />
                      {pin.name}
                    </div>
                  ))}

                  <div className="absolute left-4 top-5 rounded-[1.45rem] border border-white/10 bg-slate-950/72 p-3.5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.36)] backdrop-blur sm:left-6 sm:top-6 sm:w-56">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">Trip total</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.03em]">฿18,640</div>
                    <div className="mt-3 space-y-2 text-sm text-white/72">
                      <div className="flex items-center justify-between">
                        <span>ค่าที่พัก</span>
                        <span>฿9,200</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ค่าเดินทาง</span>
                        <span>฿4,180</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ค่าอาหาร</span>
                        <span>฿5,260</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 w-[220px] rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] p-3 text-slate-900 shadow-[0_24px_50px_rgba(15,23,42,0.36)] sm:bottom-6 sm:right-6 sm:w-[250px] sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                          Settlement
                        </div>
                        <div className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                          สรุปยอดโอนพร้อมจบ
                        </div>
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Auto
                      </div>
                    </div>

                    <div className="mt-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                    <div className="mt-4 space-y-2.5 text-sm">
                      <div className="rounded-2xl bg-slate-950 px-3 py-2.5 text-white">
                        <div className="flex items-center justify-between">
                          <span>Mint</span>
                          <span className="font-semibold">โอนให้ Beam</span>
                        </div>
                        <div className="mt-1 text-lg font-semibold">฿1,120</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2.5 text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Jane</span>
                          <span className="font-medium">โอนให้ Mint</span>
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">฿540</div>
                      </div>
                      <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                        ลดการโอนหลายต่อ เหลือเฉพาะยอดที่ต้องจ่ายจริง
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white/70">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Bangkok to Tokyo
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Seoul city trip
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    London group stay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <div className="grid gap-8 border-y border-slate-900/10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-md">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                Why it converts
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 md:text-4xl">
                ไม่ต้องอธิบายเยอะ
                <br />
                แค่ให้ทุกคนเห็นยอดเดียวกัน
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {proofPoints.map((item) => (
                <div key={item.title} className="border-t border-slate-900/10 pt-4">
                  <item.icon className="h-5 w-5 text-slate-950" />
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
          <div className="grid gap-10 rounded-[2.5rem] bg-slate-950 px-6 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.16)] md:px-10 md:py-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
                Faster start
              </div>
              <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-4xl">
                เริ่มหารเงินได้ในไม่กี่จังหวะ
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65 md:text-base">
                ไม่มี onboarding ยาว ไม่มีการชวนเพื่อนแบบยุ่งยาก ทุกอย่างถูกออกแบบให้เริ่มได้จากสิ่งที่ทุกคนใช้อยู่แล้ว
              </p>
            </div>

            <div className="grid gap-4">
              {flowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur md:grid-cols-[72px_1fr] md:items-start"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-slate-950">
                    0{index + 1}
                  </div>
                  <div>
                    <div className="text-xl font-semibold tracking-[-0.03em]">{step.title}</div>
                    <p className="mt-2 text-sm leading-6 text-white/65">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
          <div className="relative overflow-hidden rounded-[2.7rem] border border-slate-900/10 bg-[linear-gradient(135deg,#fff7ea_0%,#efe5cf_48%,#dde7dd_100%)] px-6 py-12 shadow-[0_34px_80px_rgba(148,163,184,0.2)] md:px-10 md:py-14">
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-emerald-100/50 blur-3xl" />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Ready now
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-[3.4rem]">
                  ให้ทริปจบด้วยความทรงจำ
                  <br />
                  ไม่ใช่เรื่องค้างคาเรื่องเงิน
                </h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                  เปิดทริป แชร์ให้เพื่อน แล้วให้ระบบช่วยสรุปยอดให้พร้อมโอนใน LINE แบบที่ทุกคนสบายใจ
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={getLineLoginUrl()}>
                  <Button className="h-14 rounded-full bg-[#06c755] px-8 text-base font-semibold text-white shadow-[0_22px_46px_rgba(6,199,85,0.3)] transition-transform hover:scale-[1.01] hover:bg-[#05b64d]">
                    เริ่มด้วย LINE ตอนนี้
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Link to="/app">
                  <Button
                    variant="outline"
                    className="h-14 rounded-full border-slate-300 bg-white/85 px-6 text-slate-700 backdrop-blur"
                  >
                    ดูหน้าแอป
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 pb-10 text-center text-sm text-slate-500 md:px-10">
        © 2026 TripSplit
      </footer>
    </div>
  );
};

export default LandingPage;
