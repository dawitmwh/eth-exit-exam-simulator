import { motion } from 'motion/react';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* 1. LAYERED BACKGROUND GLOWS */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-950 rounded-full blur-[120px]" 
      />
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,transparent_0%, primary_70%)]" />

      {/* 2. CENTRAL CONTENT */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="flex flex-col items-center"
        >
          {/* Animated Logo Container */}
          <div className="relative mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border border-dashed border-emerald-500/30 rounded-full"
            />
            <div className="w-24 h-24 bg-gradient-to-br from-brown/80 to-brown/97 rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-500/40 border border-white/20">
              <GraduationCap className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Text Branding */}
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">
            EXIT<span className="text-emerald-500">EXAMINER</span>
          </h1>
          
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-white/10 backdrop-blur-md">
             <ShieldCheck size={14} className="text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">
               Authenticated Session
             </span>
          </div>
        </motion.div>

        {/* 3. PREMIUM PROGRESS LINE */}
        <div className="mt-16 w-48 mx-auto h-1 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
          />
        </div>
      </div>

      {/* Footer Label */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
         <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.5em]">
           Institutional Framework v1.2
         </p>
      </div>
    </motion.div>
  );
}






// import { motion } from 'motion/react';
// import { GraduationCap } from 'lucide-react';

// export function SplashScreen() {
//   return (
//     <motion.div
//       initial={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary to-primary/80"
//     >
//       <motion.div
//         initial={{ scale: 0.5, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         transition={{ duration: 0.5, ease: 'easeOut' }}
//         className="text-center"
//       >
//         <motion.div
//           animate={{
//             scale: [1, 1.1, 1],
//             rotate: [0, 5, -5, 0],
//           }}
//           transition={{
//             duration: 2,
//             repeat: Infinity,
//             ease: 'easeInOut',
//           }}
//           className="inline-flex items-center justify-center w-24 h-24 bg-primary-foreground rounded-full mb-6"
//         >
//           <GraduationCap className="w-12 h-12 text-primary" />
//         </motion.div>
//         <h1 className="text-3xl font-bold text-primary-foreground mb-2">Exitddddd Examiner</h1>
//         <p className="text-primary-foreground/80">Preparing your experience...</p>

//         <div className="mt-8">
//           <div className="flex items-center justify-center gap-2">
//             {[0, 1, 2].map((i) => (
//               <motion.div
//                 key={i}
//                 animate={{
//                   scale: [1, 1.5, 1],
//                   opacity: [0.5, 1, 0.5],
//                 }}
//                 transition={{
//                   duration: 1,
//                   repeat: Infinity,
//                   delay: i * 0.2,
//                 }}
//                 className="w-2 h-2 bg-primary-foreground rounded-full"
//               />
//             ))}
//           </div>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// }
