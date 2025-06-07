/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-20 04:31:14
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-08 04:55:33
 */
// src/utils/idUtils.js

import { UNIQUE_ID_PREFIXES, ID_GENERATION_CONSTANTS } from "@/config/enumConfig";

/**
 * Generates a unique ID with a given prefix, using a UUID for the core identifier.
 * Structure: prefix-UUID
 * Example: item-f47ac10b-58cc-4372-a567-0e02b2c3d479
 *
 * Rules for ID Generation:
 * 1.  **Purpose**: To provide a consistent, traceable, and highly unique way of generating identifiers
 *     for various entities within the application.
 *
 * 2.  **Format**: `prefix-UUID`
 *     -   `prefix`: A short string indicating the type of entity (e.g., "item", "summon", "skill").
 *         This should be lowercase.
 *     -   `UUID`: A Version 4 UUID generated using `crypto.randomUUID()`.
 *
 * 3.  **Uniqueness**:
 *     -   Utilizes Version 4 UUIDs, which are designed to be globally unique.
 *     -   The probability of collision is extremely low, making it suitable for a wide range of applications,
 *         including distributed systems.
 *
 * 4.  **Readability & Debugging**:
 *     -   The prefix makes it easy to identify the type of entity an ID refers to during debugging.
 *     -   The UUID itself, while not human-readable for its content, is a standard unique identifier.
 *
 * 5.  **Usage**:
 *     -   The `generateUniqueId(prefix)` function from `src/utils/idUtils.js` MUST be used for all new ID generation.
 *     -   Appropriate prefixes MUST be chosen for different entity types.
 *
 * 6.  **Prefix Examples**:
 *     -   `item`: For individual items in inventory or equipped.
 *     -   `summon`: For individual summon creatures.
 *     -   `skill`: For individual skillSet (if they need unique instance IDs).
 *     -   `save`: For game save slots.
 *     -   `log`: For log entries, if applicable.
 *     -   `notification`: For UI notifications.
 *
 * 7.  **Considerations**:
 *     -   `crypto.randomUUID()` is available in modern browsers and Node.js environments.
 *       If targeting very old environments, a polyfill or a different UUID library might be needed,
 *       but for typical Vite/React projects, this should be fine.
 */
export const generateUniqueId = (prefix = UNIQUE_ID_PREFIXES.DEFAULT) => {
  if (typeof prefix !== 'string' || prefix.length === 0) {
    console.warn(`generateUniqueId: Prefix should be a non-empty string. Using default "${UNIQUE_ID_PREFIXES.DEFAULT}".`);
    prefix = UNIQUE_ID_PREFIXES.DEFAULT;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuid = crypto.randomUUID();
    return `${prefix.toLowerCase()}-${uuid}`;
  } else {
    // Fallback for environments where crypto.randomUUID is not available
    // This is a simplified (less robust) UUID-like generator, consider a proper polyfill for production if needed.
    console.warn('crypto.randomUUID not available. Using a fallback ID generator. Consider a polyfill for robust UUIDs.');
    const timestampPart = Date.now().toString(36);
    const randomPart1 = Math.random().toString(36).substring(2, 10); // 8 chars
    const randomPart2 = Math.random().toString(36).substring(2, 10); // 8 chars
    return `${prefix.toLowerCase()}-${ID_GENERATION_CONSTANTS.FALLBACK_INDICATOR}-${timestampPart}-${randomPart1}-${randomPart2}`;
  }
};
