
import { Link } from "react-router-dom";
import { User, QrCode, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { title: "เพิ่มรายจ่ายง่าย ๆ", desc: "เลือกคนจ่าย เลือกคนแชร์ ระบบคำนวณให้อัตโนมัติ" },
  { title: "แชร์ QR ให้เพื่อน", desc: "สแกนเพื่อเข้าร่วมทริปได้ทันที" },
  { title: "สรุปว่าใครต้องโอนใคร", desc: "ลดจำนวนการโอนให้เหลือน้อยที่สุด" },
];

const steps = [
  { icon: User, label: "Login ด้วย LINE" },
  { icon: QrCode, label: "สร้างทริปและแชร์ QR" },
  { icon: Wallet, label: "เพิ่มรายจ่ายและดูสรุป" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <span className="text-xl font-bold tracking-tight">TripSplit</span>
        <Button variant="outline" size="sm">Sign in</Button>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
          หารเงินกันในทริป<br />จบในที่เดียว
        </h1>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
          ไม่ต้องโหลดแอป ไม่ต้องสมัครใหม่<br />
          เข้าสู่ระบบด้วย LINE แล้วเริ่มทริปได้ทันที
        </p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <a href="/auth/line/start">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-base px-8 py-6 rounded-xl">
              เริ่มทริปด้วย LINE
            </Button>
          </a>
          <Link to="/app">
            <Button variant="outline" size="sm" className="text-muted-foreground">
              เข้าแอป (ทดสอบ)
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="rounded-xl border shadow-none">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-10">เริ่มต้นใน 3 ขั้นตอน</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <s.icon className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{i + 1}. {s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <p className="text-xl font-semibold mb-6">พร้อมเริ่มทริปแล้วหรือยัง?</p>
        <a href="/auth/line/start">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-base px-8 py-6 rounded-xl">
            เข้าสู่ระบบด้วย LINE
          </Button>
        </a>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2026 TripSplit
      </footer>
    </div>
  );
};

export default LandingPage;
