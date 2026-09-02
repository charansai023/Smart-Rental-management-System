import { useState } from "react";
import Modal from "./Modal";
import QrScannerModal from "./QrScannerModal";
import Icon from "./Icon";
import { SITES, OPERATORS } from "../lib/referenceData";
import { useFleetData } from "../context/FleetDataContext";
import { getEquipmentQrUrl } from "../lib/api";

export default function CheckoutModal({ equipmentOptions, defaultEquipmentId, onClose }) {
  const { checkout, notify, equipment } = useFleetData();
  const [equipmentId, setEquipmentId] = useState(defaultEquipmentId || equipmentOptions?.[0]?.equipment_id || "");
  const [operatorId, setOperatorId] = useState(OPERATORS[0].operator_id);
  const [operatorEmail, setOperatorEmail] = useState("");
  const [siteId, setSiteId] = useState(SITES[0].site_id);
  const [days, setDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await checkout({
        qr_code: `EQUIPMENT:${equipmentId}`,
        operator_id: operatorId,
        operator_email: operatorEmail || null,
        site_id: siteId,
        rental_days: Number(days),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Checkout failed.");
      notify(err.message || "Checkout failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanSuccess = (qrPayload, scannedEqId) => {
    setShowScanner(false);
    const matched = (equipmentOptions || equipment).find(
      (e) => e.equipment_id === scannedEqId || e.qr_code === qrPayload
    );
    if (matched) {
      setEquipmentId(matched.equipment_id);
      notify(`Scanned ${matched.equipment_id} (${matched.type}) successfully!`, "success");
    } else {
      setError(`Scanned equipment '${scannedEqId}' is not currently available for lease.`);
    }
  };

  return (
    <>
      <Modal
        title="Check Out Asset (QR Code Lease)"
        onClose={onClose}
        footer={
          <>
            <button
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-all uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              form="checkout-form"
              type="submit"
              disabled={submitting || !equipmentId}
              className="text-xs font-bold px-5 py-2.5 bg-cat-yellow text-slate-950 rounded-lg shadow-sm hover:shadow-md hover:bg-cat-yellow-hover transition-all uppercase tracking-wider disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? "Checking out…" : "Confirm Checkout"}
            </button>
          </>
        }
      >
        <form id="checkout-form" onSubmit={submit} className="space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 font-medium">
              {error}
            </div>
          )}

          {/* QR Code Tag Card & Scanner Trigger */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {equipmentId && (
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center shadow-2xs">
                  <img
                    src={getEquipmentQrUrl(equipmentId)}
                    alt={`QR Code ${equipmentId}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Asset QR Tag</div>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {equipmentId ? `EQUIPMENT:${equipmentId}` : "No Asset Selected"}
                </div>
                <div className="text-[10px] text-slate-500">Scanned at machine check-out</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 text-amber-400 px-3 py-2 rounded-lg hover:bg-slate-800 transition-all uppercase tracking-wider shadow-sm shrink-0"
            >
              <Icon name="qr_code_scanner" className="text-[16px]" /> Scan QR
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Equipment Asset</label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={!!defaultEquipmentId}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 disabled:bg-slate-100 font-mono text-slate-900"
            >
              {(equipmentOptions || []).map((eq) => (
                <option key={eq.equipment_id} value={eq.equipment_id}>
                  {eq.equipment_id} — {eq.type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Assigned Operator</label>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
            >
              {OPERATORS.map((o) => (
                <option key={o.operator_id} value={o.operator_id}>
                  {o.name} ({o.operator_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Operator Email (Gmail)</label>
            <input
              type="email"
              placeholder="e.g. operator@gmail.com"
              value={operatorEmail}
              onChange={(e) => setOperatorEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Deployment Site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
            >
              {SITES.map((s) => (
                <option key={s.site_id} value={s.site_id}>
                  {s.name} ({s.site_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Lease Duration (Days)</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono text-slate-900"
            />
          </div>
        </form>
      </Modal>

      {showScanner && (
        <QrScannerModal
          mode="checkout"
          equipmentList={equipmentOptions || equipment}
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}


