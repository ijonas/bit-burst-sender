// This file provides polyfills for Node.js built-ins that are needed by bitcoinjs-lib
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;
// Make global available
window.global = window;

// Add any other polyfills needed by bitcoinjs-lib here
