/**
 * Style Manager Utility
 *
 * A utility for safely managing dynamic styles in React components.
 * Helps prevent "Failed to execute 'removeChild' on 'Node'" errors.
 */

// Keep track of style elements and their reference counts
const styleRefs = new Map();

/**
 * Safely injects CSS styles into the document head
 * @param {string} css - The CSS style string to inject
 * @param {string} id - A unique identifier for this style
 * @returns {function} - Cleanup function to remove the style safely
 */
export function injectStyle(css, id) {
  const styleId = `dynamic-style-${id}`;

  // Check if this style already exists
  if (styleRefs.has(styleId)) {
    // Increment reference count
    styleRefs.set(styleId, styleRefs.get(styleId) + 1);
    return () => removeStyle(styleId);
  }

  // Create new style element
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);

  // Store with reference count of 1
  styleRefs.set(styleId, 1);

  // Return cleanup function
  return () => removeStyle(styleId);
}

/**
 * Safely removes a style element when no longer needed
 * @param {string} styleId - The unique ID of the style to remove
 */
function removeStyle(styleId) {
  if (!styleRefs.has(styleId)) return;

  // Decrement reference count
  const refCount = styleRefs.get(styleId) - 1;

  if (refCount <= 0) {
    // Remove style element when no more references
    try {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        // Simply use the Element.remove() method
        // This is supported in all modern browsers and avoids removeChild entirely
        styleElement.remove();
      }
    } catch (error) {
      console.warn(`Failed to remove style element ${styleId}:`, error);
    } finally {
      // Always clean up the reference
      styleRefs.delete(styleId);
    }
  } else {
    // Update reference count
    styleRefs.set(styleId, refCount);
  }
}
