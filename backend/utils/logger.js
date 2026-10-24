/**
 * Security Audit Logger
 * Logs security and system events while redacting passwords, tokens, and sensitive headers.
 */

const REDACT_KEYS = ['password', 'token', 'authorization', 'secret', 'cookie', 'csrf', 'pin'];

const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (REDACT_KEYS.some(k => key.toLowerCase().includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeLogData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (msg, meta = {}) => {
    console.log(`[${formatTimestamp()}] [INFO]: ${msg}`, Object.keys(meta).length ? JSON.stringify(sanitizeLogData(meta)) : '');
  },

  warn: (msg, meta = {}) => {
    console.warn(`[${formatTimestamp()}] [WARN]: ${msg}`, Object.keys(meta).length ? JSON.stringify(sanitizeLogData(meta)) : '');
  },

  error: (msg, meta = {}) => {
    console.error(`[${formatTimestamp()}] [ERROR]: ${msg}`, Object.keys(meta).length ? JSON.stringify(sanitizeLogData(meta)) : '');
  },

  securityAudit: ({ event, ip, userId, status, details = {} }) => {
    const entry = {
      timestamp: formatTimestamp(),
      event,
      ip: ip || 'unknown',
      userId: userId || 'anonymous',
      status: status || 'ATTEMPT',
      details: sanitizeLogData(details)
    };
    console.log(`[${formatTimestamp()}] [SECURITY AUDIT]: ${JSON.stringify(entry)}`);
  },

  sanitizeLogData
};

module.exports = logger;

