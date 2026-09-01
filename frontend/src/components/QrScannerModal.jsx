import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { getEquipmentQrUrl } from "../lib/api";

export default function QrScannerModal({ mode = "checkout", equipmentList = [], onScanSuccess, onClose }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "simulator" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const [selectedEqId, setSelectedEqId] = useState(equipmentList[0]?.equipment_id || "");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Attempt camera access when camera tab is active
  useEffect(() => {
    if (activeTab !== "camera") {
      stopCamera();
      return;
    }

    setCameraError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          setCameraError("Camera access unavailable or permission denied. Use the QR Code Simulator tab.");
        });
    } else {
      setCameraError("Camera media devices API not supported in this browser environment. Use the QR Code Simulator tab.");
    }

    return () => stopCamera();
  }, [activeTab]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleSimulatedScan = (equipmentId) => {
    const payload = `EQUIPMENT:${equipmentId}`;
    onScanSuccess(payload, equipmentId);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const clean = manualCode.trim();
    const eqId = clean.includes(":") ? clean.split(":").pop() : clean;
    onScanSuccess(clean, eqId);
  };

  return (
    <Modal
      title={mode === "checkout" ? "QR Code Scanner — Check Out" : "QR Code Scanner — Check In"}
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          className="text-xs font-semibold px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 uppercase tracking-wider"
        >
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {/* Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "camera" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon name="photo_camera" className="text-[16px]" /> Live Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "simulator" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon name="qr_code_scanner" className="text-[16px]" /> QR Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "manual" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon name="keyboard" className="text-[16px]" /> Enter Code
          </button>
        </div>

        {/* Tab 1: Camera Feed View */}
        {activeTab === "camera" && (
          <div className="space-y-3 text-center">
            {cameraError ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <Icon name="warning" className="text-[18px] text-amber-600" /> Camera Access Notice
                </div>
                <p>{cameraError}</p>
                <button
                  onClick={() => setActiveTab("simulator")}
                  className="mt-2 text-xs font-bold text-slate-900 bg-cat-yellow px-3 py-1.5 rounded-lg shadow-2xs uppercase tracking-wider hover:bg-cat-yellow-hover"
                >
                  Switch to QR Code Simulator →
                </button>
              </div>
            ) : (
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-square border border-slate-800 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Scanner Target Frame Overlay */}
                <div className="absolute inset-0 border-40 border-slate-950/60 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-cat-yellow rounded-xl relative shadow-2xl animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cat-yellow -mt-1 -ml-1 rounded-tl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cat-yellow -mt-1 -mr-1 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cat-yellow -mb-1 -ml-1 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cat-yellow -mb-1 -mr-1 rounded-br" />
                    {/* Laser Scanner Line */}
                    <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444] animate-bounce top-1/2 relative" />
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500 font-medium">Position the machine's QR code tag inside the target box</p>
          </div>
        )}

        {/* Tab 2: Interactive Digital QR Simulator */}
        {activeTab === "simulator" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Select any machinery unit below to scan its official Caterpillar QR Code tag generated by the backend API:
            </p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {equipmentList.map((eq) => (
                <div
                  key={eq.equipment_id}
                  onClick={() => handleSimulatedScan(eq.equipment_id)}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {/* Real PNG QR Code generated by backend endpoint */}
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center">
                      <img
                        src={getEquipmentQrUrl(eq.equipment_id)}
                        alt={`QR ${eq.equipment_id}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-slate-900 text-sm group-hover:text-amber-600">
                        {eq.equipment_id}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{eq.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{eq.qr_code}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-xs font-bold bg-cat-yellow text-slate-950 px-3 py-1.5 rounded-lg uppercase tracking-wider group-hover:bg-cat-yellow-hover shadow-2xs"
                  >
                    Scan Tag →
                  </button>
                </div>
              ))}

              {equipmentList.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  No machinery assets available for this operation.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Manual Entry */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                QR Code Payload / Serial String
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. EQUIPMENT:EQX1001"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white font-mono focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full py-2.5 bg-cat-yellow text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm hover:bg-cat-yellow-hover disabled:opacity-40"
            >
              Submit Scanned QR Code
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
