import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Zap, Shield, Check, Loader2, Sparkles } from 'lucide-react';
import { VOICE_TOP_UP_PACKS, priceForTopUp, formatINR } from '../../shared/plans';
import { launchRazorpayPayment } from '../../lib/razorpay';
import { useToast } from './ui/Toast';

export interface VoiceTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPlanStatus: any) => void;
  userEmail?: string;
  userName?: string;
}

export const VoiceTopUpModal: React.FC<VoiceTopUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
  userName,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>('voice_100');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const currentPack = priceForTopUp(selectedPackId);

  const handlePay = async () => {
    setLoading(true);
    try {
      await launchRazorpayPayment({
        type: 'voice_topup',
        packId: selectedPackId,
        userEmail,
        userName,
        onSuccess: (status) => {
          setLoading(false);
          toast.success(
            `Voice Top-Up Credited! Added ${currentPack.pack?.minutes || 100} minutes to your balance.`
          );
          if (onSuccess) onSuccess(status);
          onClose();
        },
        onError: (err: any) => {
          setLoading(false);
          toast.error(err?.message || 'Payment could not be completed.');
        },
        onDismiss: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message || 'Failed to start payment');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#141414] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 sm:p-7 shadow-2xl z-10 space-y-6 text-[#F4F4F5]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Phone className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold font-serif text-white tracking-tight">
                Top-Up AI Voice Minutes
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-crm-sans leading-relaxed">
              Top-up minutes never expire at month-end and carry over automatically until fully consumed.
            </p>
          </div>

          {/* Pack Selection */}
          <div className="grid grid-cols-2 gap-3.5">
            {VOICE_TOP_UP_PACKS.map((pack) => {
              const isSelected = selectedPackId === pack.id;
              const pricing = priceForTopUp(pack.id);
              return (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#1A1A1A] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                      : 'bg-[#111111] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  {pack.id === 'voice_500' && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-black">
                      Best Value
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">
                        {pack.minutes} Minutes
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                            : 'border-gray-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="text-xl font-serif font-bold text-white">
                      {formatINR(pricing.subtotal)}
                    </div>

                    <div className="text-[11px] text-gray-400">
                      ₹9/min • +18% GST
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price Breakdown */}
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 space-y-2 text-xs font-crm-mono">
            <div className="flex justify-between text-gray-400">
              <span>{currentPack.pack?.minutes} Voice Minutes:</span>
              <span className="text-white">{formatINR(currentPack.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>GST (18%):</span>
              <span className="text-white">{formatINR(currentPack.gst)}</span>
            </div>
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex justify-between items-center text-sm font-semibold">
              <span className="text-white">Total Payable:</span>
              <span className="text-[#D4AF37] text-base">{formatINR(currentPack.total)}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#D4AF37] hover:bg-[#b8952b] text-black font-semibold text-sm rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing with Razorpay...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black" />
                <span>Pay {formatINR(currentPack.total)} with Razorpay</span>
              </>
            )}
          </button>

          {/* Guarantee / Security Note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-crm-sans text-center">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span>Encrypted 256-bit Razorpay Gateway • GST Tax Invoice Issued Instantly</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
