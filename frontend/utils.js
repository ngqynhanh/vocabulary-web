//function 1: Capitalize first letter ("apple" to "Apple")
export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

//function 2: Clean up input (remove spaces)
export function sanitizeInput(str) {
    if (!str) return "";
    return str.trim().toLowerCase(); //"Apple" to "apple"
}

//function 3: A helper that is NOT exported (Private to this file)
function secretHelper() {
    console.log("Only this file can use me!");
}