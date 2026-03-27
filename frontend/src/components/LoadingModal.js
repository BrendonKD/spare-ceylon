import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingModal = ({ 
  isOpen, 
  status = 'loading', 
  message = '' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: '✅',
          title: 'Part Found!',
          color: '#10B981'
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Upload Issue',
          color: '#EF4444'
        };
      default:
        return {
          icon: '🔍',
          title: 'Searching...',
          color: '#0E544F'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              maxWidth: "400px",
              width: "90vw"
            }}
            className="text-center"
          >
            {/* Status Icon & Title */}
            <div className="mb-4">
              <div 
                className="mb-3 d-flex justify-content-center align-items-center"
                style={{ fontSize: "48px" }}
              >
                {config.icon}
              </div>
              <h3 
                className="h4 fw-bold mb-2"
                style={{ color: config.color }}
              >
                {config.title}
              </h3>
            </div>

            {/* Message */}
            {message && (
              <p 
                className="mb-4" 
                style={{ 
                  fontSize: "1rem",
                  color: status === 'error' ? '#6B7280' : '#374151'
                }}
              >
                {message}
              </p>
            )}

            {/* Animated Gears (always spin during loading) */}
            {status === 'loading' && (
              <div className="mb-4">
                <div style={{ position: "relative", width: "192px", height: "128px", margin: "0 auto" }}>
                  {/* Your existing gear CSS animations here */}
                  {/* ... same gear code as before ... */}
                </div>
              </div>
            )}

            {/* Bouncing Dots */}
            <div className="d-flex justify-content-center gap-2 mb-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    backgroundColor: status === 'loading' ? ['#0E544F', '#8D183A', '#0E544F'] : [config.color]
                  }}
                  transition={{
                    duration: status === 'loading' ? 1 : 0.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: config.color
                  }}
                />
              ))}
            </div>

            {/* Auto-close timer */}
            <small className="text-muted">
              Auto-closing in 3s...
            </small>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingModal;