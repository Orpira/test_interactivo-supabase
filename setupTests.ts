import "@testing-library/jest-dom";

// jsdom no implementa scrollTo (lo usa framer-motion en las animaciones)
window.scrollTo = () => {};
