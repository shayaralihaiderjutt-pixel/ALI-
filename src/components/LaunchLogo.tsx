import { motion } from "motion/react";

export default function LaunchLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 flex items-center justify-center bg-[#064e3b] z-50"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ rotate: -180 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 1, ease: "backOut" }}
          className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-4xl shadow-xl"
        >
          W&E
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white font-bold text-2xl tracking-wider"
        >
          WATCH & EARN
        </motion.h1>
      </div>
    </motion.div>
  );
}
