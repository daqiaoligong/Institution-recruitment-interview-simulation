import { useLocation, useOutlet } from "react-router-dom";
import { TopNav } from "../nav/TopNav";
import { AnimatePresence, motion } from "framer-motion";

export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  
  return (
    <div className="app-shell">
      <TopNav />
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", height: "100%" }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
