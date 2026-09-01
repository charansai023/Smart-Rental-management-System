import Icon from "./Icon";

export default function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200/80 shadow-modal w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-full transition-colors">
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">{footer}</div>}
      </div>
    </div>
  );
}

