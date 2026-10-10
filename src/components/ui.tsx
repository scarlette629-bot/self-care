import { useEffect, useRef, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Bean,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Droplet,
  Flower2,
  Footprints,
  Heart,
  Leaf,
  Microscope,
  Moon,
  Plus,
  Stethoscope,
  TestTubeDiagonal,
  Thermometer,
  Weight,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
const icons: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  heart: Heart,
  droplet: Droplet,
  weight: Weight,
  wind: Wind,
  thermometer: Thermometer,
  moon: Moon,
  footprints: Footprints,
  test: TestTubeDiagonal,
  leaf: Leaf,
  bean: Bean,
  microscope: Microscope,
  flower: Flower2,
  activity: Activity,
  bell: Bell,
  calendar: CalendarDays,
};
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const I = icons[name] ?? Activity;
  return <I size={size} strokeWidth={1.8} />;
}
export function BadgeIcon({
  name,
  color = "#0e8587",
}: {
  name: string;
  color?: string;
}) {
  return (
    <span className="badge-icon" style={{ color, background: `${color}12` }}>
      <Icon name={name} />
    </span>
  );
}
export function Empty({
  title = "還沒有紀錄",
  description = "從第一筆紀錄開始，慢慢認識自己的健康變化。",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Leaf size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    d?.showModal();
    return () => {
      d?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-heading"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-head">
        <h2 id="dialog-heading">{title}</h2>
        <button className="icon-button" aria-label="關閉" onClick={close}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function SectionTitle({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export { ArrowRight, Check, ChevronRight, Plus };
