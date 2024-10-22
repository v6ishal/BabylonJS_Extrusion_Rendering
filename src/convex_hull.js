// Function to compute convex hull using Graham Scan algorithm
export function computeConvexHull(points) {
    // Sort the points by X, then by Z coordinate
    points.sort(function (a, b) {
        if (a.x !== b.x) return a.x - b.x;
        return a.z - b.z;
    });

    // Build lower hull
    const lower = [];
    for (let i = 0; i < points.length; i++) {
        while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
            lower.pop();
        }
        lower.push(points[i]);
    }

    // Build upper hull
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
            upper.pop();
        }
        upper.push(points[i]);
    }

    // Concatenate lower and upper hull, removing the last point of each half (it's repeated at the beginning of the other half)
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

// Utility function to compute the cross product of two vectors
function crossProduct(o, a, b) {
    return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
}

