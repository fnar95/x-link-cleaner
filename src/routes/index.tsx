import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ClipboardPaste,
  Copy,
  ExternalLink,
  Info,
  ShieldCheck,
  Sparkles,
  X,
  CircleAlert,
  FlaskConical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  cleanXUrl,
  EXAMPLE_URL,
  MAX_INPUT_LENGTH,
  type CleanErrorCode,
  type CleanResult,
} from "@/lib/clean-x-url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منظّف روابط X — أزل معاملات التتبع من روابط المنشورات" },
      {
        name: "description",
        content:
          "الصق رابط منشور من X أو تويتر واحصل على الرابط النظيف ‎x.com/user/status/id‎ دون ?s= و ?t= — يعمل بالكامل داخل متصفحك.",
      },
      { property: "og:title", content: "منظّف روابط X" },
      {
        property: "og:description",
        content: "أزل معاملات الاستعلام من روابط منشورات X وتويتر — بلا اتصال، بلا تخزين، بلا تسجيل.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ERROR_MESSAGES: Record<CleanErrorCode, string> = {
  empty: "الصق رابط منشور أولًا.",
  too_long: `الرابط طويل جدًا (الحد ${MAX_INPUT_LENGTH} حرفًا).`,
  invalid_url: "هذا لا يبدو رابطًا صالحًا. تأكد من نسخه كاملًا.",
  unsupported_host: "النطاق غير مدعوم. نقبل فقط x.com و twitter.com و mobile.twitter.com.",
  not_a_post: "لم نعثر على منشور في الرابط. يجب أن يحتوي على ‎/status/‎ متبوعًا برقم المنشور.",
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function Index() {
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();
  const switchId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [stripMedia, setStripMedia] = useState(true);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [canReadClipboard, setCanReadClipboard] = useState(false);

  useEffect(() => {
    setCanReadClipboard(typeof navigator !== "undefined" && !!navigator.clipboard?.readText);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const runClean = useCallback(
    (value: string, media = stripMedia) => {
      setCopied(false);
      setNotice(null);
      setResult(cleanXUrl(value, { stripMedia: media }));
    },
    [stripMedia],
  );

  const handlePaste = async () => {
    setNotice(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setNotice("الحافظة فارغة. انسخ رابط المنشور ثم حاول مجددًا.");
        return;
      }
      const value = text.slice(0, MAX_INPUT_LENGTH + 1);
      setInput(value);
      runClean(value);
    } catch {
      setNotice("لم يُسمح بقراءة الحافظة. الصق يدويًا بالضغط على Ctrl+V أو ⌘+V.");
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
    setCopied(false);
    setNotice(null);
    textareaRef.current?.focus();
  };

  const handleExample = () => {
    setInput(EXAMPLE_URL);
    runClean(EXAMPLE_URL);
  };

  const handleCopy = async () => {
    if (!result?.ok) return;
    const ok = await copyText(result.url);
    if (ok) setCopied(true);
    else setNotice("تعذّر النسخ تلقائيًا. حدّد الرابط وانسخه يدويًا.");
  };

  const handleToggleMedia = (checked: boolean) => {
    setStripMedia(checked);
    if (result) runClean(input, checked);
  };

  const error = result && !result.ok ? ERROR_MESSAGES[result.error] : null;
  const success = result?.ok ? result : null;
  const removedItems = success
    ? [
        ...success.removedParams.map((p, i) => (i === 0 ? `?${p}` : `&${p}`)),
        ...(success.removedPath ? [success.removedPath] : []),
        ...(success.removedHash ? [`#${success.removedHash}`] : []),
      ]
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-grid" />

      <main className="relative mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-16 pt-12 sm:pt-20">
        {/* Header */}
        <header className="flex flex-col items-center gap-5 text-center animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            يعمل داخل متصفحك فقط · لا إرسال ولا تخزين
          </span>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-2xl bg-gradient-primary font-display text-2xl font-bold text-primary-foreground shadow-glow"
            >
              X
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              منظّف روابط <span className="text-gradient-primary">X</span>
            </h1>
          </div>
          <p className="max-w-md text-balance text-base leading-relaxed text-muted-foreground">
            الصق رابط منشور من X أو تويتر، وسنحذف منه معاملات التتبع لنعطيك الرابط الأصلي النظيف.
          </p>
        </header>

        {/* Input card */}
        <section
          aria-labelledby={`${inputId}-label`}
          className="rounded-3xl border border-border bg-card/80 p-4 shadow-card backdrop-blur sm:p-6 animate-rise"
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              runClean(input);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-3">
              <label
                id={`${inputId}-label`}
                htmlFor={inputId}
                className="font-display text-sm font-medium text-foreground"
              >
                رابط المنشور
              </label>
              <button
                type="button"
                onClick={handleExample}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FlaskConical className="size-3.5" aria-hidden />
                جرّب مثالًا
              </button>
            </div>

            <textarea
              ref={textareaRef}
              id={inputId}
              dir="ltr"
              rows={3}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="url"
              maxLength={MAX_INPUT_LENGTH + 1}
              value={input}
              placeholder="https://x.com/user/status/1234567890?s=48"
              aria-invalid={!!error}
              aria-describedby={cn(hintId, error && errorId)}
              onChange={(e) => {
                setInput(e.target.value);
                if (result) setResult(null);
              }}
              onPaste={() => {
                requestAnimationFrame(() => {
                  const v = textareaRef.current?.value ?? "";
                  if (v.trim()) runClean(v);
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  runClean(input);
                }
              }}
              className={cn(
                "w-full resize-none rounded-2xl border bg-surface px-4 py-3 text-left font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                error ? "border-destructive/70" : "border-input",
              )}
            />

            <p id={hintId} className="text-xs text-muted-foreground">
              اضغط Enter للتنظيف. يُنظَّف الرابط تلقائيًا عند اللصق.
            </p>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            {notice && (
              <p role="status" className="text-sm text-warning">
                {notice}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 px-3 py-2.5">
              <label htmlFor={switchId} className="text-sm text-secondary-foreground">
                إزالة <bdi dir="ltr" className="font-mono text-xs">/photo/1</bdi> و{" "}
                <bdi dir="ltr" className="font-mono text-xs">/video/1</bdi> من نهاية الرابط
              </label>
              <Switch id={switchId} checked={stripMedia} onCheckedChange={handleToggleMedia} />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                {canReadClipboard && (
                  <Button type="button" variant="soft" size="pill" onClick={handlePaste}>
                    <ClipboardPaste aria-hidden />
                    لصق
                  </Button>
                )}
                <Button
                  type="button"
                  variant="soft"
                  size="pill"
                  onClick={handleClear}
                  disabled={!input && !result}
                >
                  <X aria-hidden />
                  مسح
                </Button>
              </div>
              <Button type="submit" variant="hero" size="xl" className="sm:ms-auto">
                <Sparkles aria-hidden />
                نظّف الرابط
              </Button>
            </div>
          </form>
        </section>

        {/* Result */}
        <section aria-live="polite" aria-label="النتيجة">
          {success && (
            <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-4 shadow-card sm:p-6 animate-rise">
              <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-primary" />
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <h2 className="font-display text-sm font-medium">الرابط النظيف</h2>
              </div>

              <output
                dir="ltr"
                className="block select-all break-all rounded-2xl border border-border bg-surface px-4 py-3 text-left font-mono text-sm leading-relaxed text-primary"
              >
                {success.url}
              </output>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="hero" size="xl" onClick={handleCopy} className="sm:flex-1">
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "تم النسخ" : "نسخ الرابط"}
                </Button>
                <Button asChild variant="soft" size="xl" className="sm:flex-1">
                  <a href={success.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                    <ExternalLink aria-hidden />
                    فتح المنشور
                  </a>
                </Button>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                {removedItems.length > 0 ? (
                  <>
                    <p className="mb-2 text-xs text-muted-foreground">
                      أُزيل {removedItems.length === 1 ? "جزء واحد" : `${removedItems.length} أجزاء`}:
                    </p>
                    <ul dir="ltr" className="flex flex-wrap gap-1.5">
                      {removedItems.map((item, i) => (
                        <li
                          key={`${item}-${i}`}
                          className="max-w-full truncate rounded-lg border border-destructive/25 bg-destructive/10 px-2 py-0.5 font-mono text-xs text-destructive line-through decoration-destructive/60"
                          title={item}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    الرابط كان نظيفًا أصلًا — لا توجد معاملات لإزالتها.
                  </p>
                )}
                {success.hostChanged && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    وُحِّد النطاق إلى <bdi className="font-mono">x.com</bdi>.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Explainer */}
        <aside className="flex gap-3 rounded-2xl border border-border bg-card/50 p-4 text-sm leading-relaxed text-muted-foreground animate-rise">
          <Info className="mt-0.5 size-5 shrink-0 text-primary-glow" aria-hidden />
          <div className="space-y-1.5">
            <p>
              <strong className="font-semibold text-foreground">ماذا يفعل؟</strong> يحذف معاملات
              الاستعلام مثل <bdi dir="ltr" className="font-mono text-xs">?s=48</bdi> و
              <bdi dir="ltr" className="font-mono text-xs">&amp;t=…</bdi> وأجزاء{" "}
              <bdi className="font-mono text-xs">#</bdi> التي تُضاف عند المشاركة وقد تكشف مصدر
              الرابط.
            </p>
            <p>
              <strong className="font-semibold text-foreground">ما لا يفعله:</strong> لا يمنع كل
              أشكال التتبع؛ فالمنصة نفسها قد تتتبع زيارتك عبر الحساب وملفات تعريف الارتباط وغيرها.
            </p>
          </div>
        </aside>

        {/* Example */}
        <section className="rounded-2xl border border-dashed border-border p-4 text-sm animate-rise">
          <h2 className="mb-3 font-display text-sm font-medium">مثال</h2>
          <dl className="space-y-2">
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">قبل</dt>
              <dd dir="ltr" className="break-all text-left font-mono text-xs text-secondary-foreground">
                https://x.com/NASA/status/1834567890123456789
                <span className="text-destructive line-through decoration-destructive/60">
                  ?a=Xy7Tq_2pLmN9vB&amp;s=48&amp;t=kD3fG8hJ2lQ
                </span>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">بعد</dt>
              <dd dir="ltr" className="break-all text-left font-mono text-xs text-primary">
                https://x.com/NASA/status/1834567890123456789
              </dd>
            </div>
          </dl>
        </section>

        <footer className="text-center text-xs text-muted-foreground">
          لا تسجيل دخول، لا إحصاءات، ولا طلبات شبكة — كل المعالجة تتم على جهازك.
        </footer>
      </main>
    </div>
  );
}
