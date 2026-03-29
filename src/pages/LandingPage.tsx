
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  QrCode,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLineLoginUrl } from "@/contexts/LineAuthContext";

const features = [
  {
    icon: Sparkles,
    title: "เพิ่มรายจ่ายได้ไว",
    desc: "ใส่ยอด เลือกคนจ่าย เลือกคนหาร ระบบช่วยคำนวณให้ทันทีแบบไม่ซับซ้อน",
  },
  {
    icon: QrCode,
    title: "ชวนเพื่อนด้วย QR",
    desc: "สร้างทริปแล้วแชร์ให้เพื่อนเข้าร่วมได้เลย ไม่ต้องค้นหาห้องหรือส่งลิงก์ยาว ๆ",
  },
  {
    icon: Wallet,
    title: "สรุปยอดพร้อมโอน",
    desc: "ดูได้ชัดว่าใครต้องจ่ายใคร เพื่อลดจำนวนการโอนและปิดจบทริปได้ง่ายขึ้น",
  },
];

const steps = [
  {
    icon: UserRound,
    title: "ล็อกอินด้วย LINE",
    desc: "เริ่มใช้งานได้ทันที ไม่ต้องสร้างบัญชีใหม่หรือจำรหัสผ่านเพิ่ม",
  },
  {
    icon: QrCode,
    title: "สร้างทริปและชวนเพื่อน",
    desc: "แชร์ QR ให้ทุกคนเข้ามาอยู่ในทริปเดียวกันแบบรวดเร็ว",
  },
  {
    icon: CheckCircle2,
    title: "ลงรายจ่ายแล้วดูสรุป",
    desc: "ติดตามค่าใช้จ่ายรวม พร้อมยอดค้างจ่ายของแต่ละคนในหน้าเดียว",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_42%,#f8faf8_100%)] text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[440px] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_58%)]" />
        <div className="absolute left-1/2 top-20 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-green-100/60 blur-3xl" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(34,197,94,0.22)]">
              TS
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">TripSplit</p>
              <p className="text-xs text-muted-foreground">แชร์ค่าใช้จ่ายในทริปแบบง่าย ๆ</p>
            </div>
          </div>

          <a href={getLineLoginUrl()}>
            <Button
              variant="outline"
              className="rounded-full border-white/70 bg-white/80 px-5 backdrop-blur hover:bg-white"
            >
              เข้าสู่ระบบ
            </Button>
          </a>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-16 pt-8 sm:px-6 lg:px-8">
          <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-white/90 px-4 py-2 text-sm text-green-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              ใช้งานผ่าน LINE ได้ทันที
            </div>

            <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              หารเงินค่าเที่ยวกับเพื่อน
              <br className="hidden sm:block" />
              ให้จบง่ายในหน้าเดียว
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              จดรายจ่าย แชร์ทริปให้เพื่อนเข้าร่วม และดูสรุปว่าใครต้องโอนใครแบบชัดเจน
              โดยไม่ต้องโหลดแอปเพิ่ม
            </p>

            <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <a href={getLineLoginUrl()} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full bg-[#06C755] px-8 text-base font-semibold text-white shadow-[0_18px_40px_rgba(6,199,85,0.24)] hover:bg-[#05b54c] sm:w-auto"
                >
                  เริ่มทริปด้วย LINE
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>

              <Link to="/app" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-full rounded-full border-slate-200 bg-white px-8 text-base text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  ดูตัวอย่างการใช้งาน
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
              {[
                "ไม่ต้องติดตั้งแอปเพิ่ม",
                "ชวนเพื่อนเข้าทริปด้วย QR",
                "สรุปยอดพร้อมโอนทันที",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4 text-sm text-slate-600 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-green-700/80">
                ฟีเจอร์เด่น
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                ทุกอย่างที่ต้องใช้ในการหารค่าใช้จ่าย
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="rounded-3xl border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                >
                  <CardContent className="p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-[2rem] border border-slate-200/70 bg-white/90 px-6 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-green-700/80">
                3 ขั้นตอน
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                เริ่มใช้งานได้ในไม่กี่นาที
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto mt-20 w-full max-w-4xl rounded-[2rem] border border-green-100 bg-[linear-gradient(135deg,#f3fff7_0%,#ffffff_55%,#effcf2_100%)] px-6 py-10 text-center shadow-[0_20px_60px_rgba(6,199,85,0.10)] sm:px-8 lg:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              พร้อมเริ่มทริปครั้งถัดไปแล้วหรือยัง?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              เข้าสู่ระบบด้วย LINE แล้วเริ่มบันทึกรายจ่ายร่วมกันได้เลย ทั้งบนมือถือและเดสก์ท็อป
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={getLineLoginUrl()} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full bg-[#06C755] px-8 text-base font-semibold text-white hover:bg-[#05b54c] sm:w-auto"
                >
                  เข้าสู่ระบบด้วย LINE
                </Button>
              </a>
              <Link to="/app" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-full rounded-full border-slate-200 bg-white px-8 text-base text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  ทดลองเข้าแอป
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="px-5 pb-8 pt-2 text-center text-sm text-slate-400 sm:px-6 lg:px-8">
          © 2026 TripSplit
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
