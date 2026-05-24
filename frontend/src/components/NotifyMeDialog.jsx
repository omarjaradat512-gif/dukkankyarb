import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input, Field } from "./admin/_widgets";
import { Bell, Loader2, Check } from "lucide-react";
import { apiCreateNotifyRequest, formatApiError } from "../lib/api";
import { toast } from "sonner";

export const NotifyMeDialog = ({ open, onOpenChange, game }) => {
    const [contact, setContact] = useState("");
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e) => {
        e?.preventDefault?.();
        if (!contact.trim()) {
            toast.error("يرجى إدخال رقم الواتساب أو الإيميل");
            return;
        }
        setBusy(true);
        try {
            const res = await apiCreateNotifyRequest({
                gameId: game.id,
                contact: contact.trim(),
                name: name.trim(),
            });
            setDone(true);
            if (res?.alreadyRegistered) {
                toast.success("راح نتواصل معك أول ما تتوفر — أنت مسجل مسبقاً");
            } else {
                toast.success("تم! راح نخبرك أول ما تتوفر اللعبة");
            }
            setTimeout(() => {
                onOpenChange(false);
                setTimeout(() => {
                    setDone(false);
                    setContact("");
                    setName("");
                }, 300);
            }, 1300);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                data-testid="notify-me-dialog"
                className="bg-[hsl(var(--brand-cream))] border-2 border-[hsl(var(--brand-ink))]/10 max-w-md"
                dir="rtl"
            >
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand-red))]/15 text-[hsl(var(--brand-red))] flex items-center justify-center mb-2">
                        <Bell className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl text-[hsl(var(--brand-ink))]">
                        أعلمني عند توفّر {game?.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[hsl(var(--brand-ink))]/65">
                        اترك تفاصيلك واحنا راح نتواصل معك مباشرة أول ما اللعبة ترجع للمتجر.
                    </DialogDescription>
                </DialogHeader>

                {done ? (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/15 text-green-600 flex items-center justify-center mx-auto mb-3">
                            <Check className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-[hsl(var(--brand-ink))]">تم التسجيل بنجاح</p>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-3 pt-2">
                        <Field label="الاسم (اختياري)">
                            <Input
                                data-testid="notify-name-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="اسمك"
                            />
                        </Field>
                        <Field label="رقم الواتساب أو الإيميل" hint="مثال: 962775XXXXXX أو you@example.com">
                            <Input
                                data-testid="notify-contact-input"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="رقم الواتساب أو الإيميل"
                                dir="ltr"
                                required
                            />
                        </Field>
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="notify-submit-button"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-full h-11 bg-[hsl(var(--brand-ink))] text-[hsl(var(--brand-cream))] text-sm font-bold hover:bg-[hsl(var(--brand-blue-deep))] disabled:opacity-50"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                            أعلمني عند التوفر
                        </button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
