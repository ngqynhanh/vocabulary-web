// Function 1: Capitalize first letter (e.g., "apple" -> "Apple")
export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function 2: Clean up input (remove spaces, etc.)
export function sanitizeInput(str) {
    if (!str) return "";
    return str.trim().toLowerCase(); // "  Apple " -> "apple"
}

// Function 3: A helper that is NOT exported (Private to this file)
function secretHelper() {
    console.log("Only this file can use me!");
}