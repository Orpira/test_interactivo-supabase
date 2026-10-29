import "@testing-library/jest-dom";

// jsdom no implementa scrollTo (lo usa framer-motion en las animaciones)
if (typeof window !== "undefined") window.scrollTo = () => {};
