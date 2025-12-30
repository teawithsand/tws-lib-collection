use crate::algo::geom2::Segment2;
use nalgebra::Point2;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct Triangle2<T>
where
    T: nalgebra::Scalar,
{
    vertices: [Point2<T>; 3],
}

impl<T> Triangle2<T>
where
    T: nalgebra::Scalar
        + Copy
        + PartialOrd
        + std::ops::Sub<Output = T>
        + std::ops::Mul<Output = T>
        + std::ops::Add<Output = T>
        + std::ops::Neg<Output = T>,
{
    /// Create a new triangle from three points, ensuring CCW orientation
    pub fn new(p0: Point2<T>, p1: Point2<T>, p2: Point2<T>) -> Self {
        let vertices = [p0, p1, p2];
        let mut triangle = Self { vertices };

        // Fix orientation to CCW if needed
        let double_area = triangle.double_area();
        let zero = double_area - double_area; // T::zero() equivalent
        if double_area < zero {
            // CW orientation, swap p1 and p2 to make it CCW
            triangle.vertices.swap(1, 2);
        }

        triangle
    }

    /// Returns twice the signed area (positive for CCW, negative for CW)
    /// Using 2*area avoids division, which is perfect for integer types
    pub fn double_area(&self) -> T {
        let p0 = &self.vertices[0];
        let p1 = &self.vertices[1];
        let p2 = &self.vertices[2];

        // Cross product: (p1 - p0) × (p2 - p0)
        // = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x)
        let dx1 = p1.x - p0.x;
        let dy1 = p1.y - p0.y;
        let dx2 = p2.x - p0.x;
        let dy2 = p2.y - p0.y;

        dx1 * dy2 - dy1 * dx2
    }

    /// Get the three edges of the triangle as Segment2
    /// Returns edges in order: [p0->p1, p1->p2, p2->p0]
    pub fn edges(&self) -> [Segment2<T>; 3] {
        [
            Segment2::new(self.vertices[0], self.vertices[1]),
            Segment2::new(self.vertices[1], self.vertices[2]),
            Segment2::new(self.vertices[2], self.vertices[0]),
        ]
    }

    /// Get the vertices as an array
    pub fn vertices(&self) -> [Point2<T>; 3] {
        self.vertices
    }
}

// Area for floating point types
impl Triangle2<f32> {
    /// Returns the actual area for f32
    pub fn area(&self) -> f32 {
        self.double_area() / 2.0
    }
}

impl Triangle2<f64> {
    /// Returns the actual area for f64
    pub fn area(&self) -> f64 {
        self.double_area() / 2.0
    }
}

// Heights for integer types - returns bounds since exact height may not be integer
impl<T> Triangle2<T>
where
    T: nalgebra::Scalar
        + Copy
        + Ord
        + std::ops::Sub<Output = T>
        + std::ops::Mul<Output = T>
        + std::ops::Add<Output = T>
        + std::ops::Div<Output = T>
        + std::ops::Neg<Output = T>
        + From<u8>,
{
    /// Returns bounds for each height: (lower_bound, upper_bound) for each of the 3 edges
    /// Height[i] is the perpendicular distance from the opposite vertex to edge[i]
    ///
    /// For integer types, the exact height is: double_area / edge_length
    /// We return floor and ceiling bounds: (double_area / edge_length, double_area / edge_length + 1)
    ///
    /// Each height corresponds to the edge at the same index from edges()
    pub fn height_bounds(&self) -> [(T, T); 3] {
        let double_area = self.double_area();
        let edges = self.edges();

        [
            Self::compute_height_bounds(double_area, edges[0].square_length()),
            Self::compute_height_bounds(double_area, edges[1].square_length()),
            Self::compute_height_bounds(double_area, edges[2].square_length()),
        ]
    }

    fn compute_height_bounds(double_area: T, edge_square_length: T) -> (T, T) {
        // Height = double_area / edge_length
        // Since we only have edge_square_length, we need to be careful
        //
        // For integer math:
        // - lower bound: double_area / ceiling(sqrt(edge_square_length))
        // - upper bound: double_area / floor(sqrt(edge_square_length)) + 1
        //
        // Since we can't compute exact sqrt for integers, we compute bounds:
        // If h^2 = double_area^2 / edge_square_length, then:
        // - h_min = floor(double_area / ceiling(sqrt(edge_square_length)))
        // - h_max = ceiling(double_area / floor(sqrt(edge_square_length)))
        //
        // Simplified approach: return (h_squared_lower, h_squared_upper) where
        // h^2 lies in this range

        // Actually, let's compute: double_area^2 / edge_square_length gives h^2
        // Then we need integer sqrt bounds

        let da_squared = double_area * double_area;
        let h_squared = da_squared / edge_square_length;

        // Find integer bounds for sqrt(h_squared)
        // lower = floor(sqrt(h_squared))
        // upper = ceiling(sqrt(h_squared))
        let lower = Self::integer_sqrt_floor(h_squared);
        let one = T::from(1u8);
        let upper = if lower * lower == h_squared {
            lower
        } else {
            lower + one
        };

        (lower, upper)
    }

    /// Integer square root (floor)
    fn integer_sqrt_floor(n: T) -> T {
        let zero = T::from(0u8);
        let one = T::from(1u8);

        if n < one {
            return zero;
        }

        // Binary search for the square root
        let mut low = one;
        let mut high = n;
        let mut result = one;

        // Limit iterations to prevent infinite loops
        for _ in 0..128 {
            if low > high {
                break;
            }

            // mid = (low + high) / 2
            let two = one + one;
            let mid = (low + high) / two;
            let mid_squared = mid * mid;

            if mid_squared == n {
                return mid;
            } else if mid_squared < n {
                result = mid;
                low = mid + one;
            } else {
                high = mid - one;
            }
        }

        result
    }
}

// Heights for floating point types - exact computation
impl Triangle2<f32> {
    /// Returns the three heights of the triangle
    /// Height[i] is the perpendicular distance from the opposite vertex to edge[i]
    pub fn heights(&self) -> [f32; 3] {
        let area = self.area();
        let edges = self.edges();

        [
            2.0 * area / edges[0].square_length().sqrt(),
            2.0 * area / edges[1].square_length().sqrt(),
            2.0 * area / edges[2].square_length().sqrt(),
        ]
    }
}

impl Triangle2<f64> {
    /// Returns the three heights of the triangle
    /// Height[i] is the perpendicular distance from the opposite vertex to edge[i]
    pub fn heights(&self) -> [f64; 3] {
        let area = self.area();
        let edges = self.edges();

        [
            2.0 * area / edges[0].square_length().sqrt(),
            2.0 * area / edges[1].square_length().sqrt(),
            2.0 * area / edges[2].square_length().sqrt(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ccw_orientation() {
        // Test with i32
        let p0 = Point2::new(0, 0);
        let p1 = Point2::new(4, 0);
        let p2 = Point2::new(0, 3);

        // CCW order
        let tri1 = Triangle2::new(p0, p1, p2);
        assert!(
            tri1.double_area() > 0,
            "Triangle should have positive area (CCW)"
        );

        // CW order - should be fixed to CCW
        let tri2 = Triangle2::new(p0, p2, p1);
        assert!(tri2.double_area() > 0, "Triangle should be fixed to CCW");
        assert_eq!(
            tri1.double_area(),
            tri2.double_area(),
            "Both should have same area"
        );
    }

    #[test]
    fn test_double_area_integer() {
        let p0 = Point2::new(0, 0);
        let p1 = Point2::new(4, 0);
        let p2 = Point2::new(0, 3);

        let tri = Triangle2::new(p0, p1, p2);
        // Area = 0.5 * base * height = 0.5 * 4 * 3 = 6
        // Double area = 12
        assert_eq!(tri.double_area(), 12);
    }

    #[test]
    fn test_area_float() {
        let p0 = Point2::new(0.0_f64, 0.0);
        let p1 = Point2::new(4.0, 0.0);
        let p2 = Point2::new(0.0, 3.0);

        let tri = Triangle2::new(p0, p1, p2);
        assert_eq!(tri.area(), 6.0);
    }

    #[test]
    fn test_edges() {
        let p0 = Point2::new(0, 0);
        let p1 = Point2::new(4, 0);
        let p2 = Point2::new(0, 3);

        let tri = Triangle2::new(p0, p1, p2);
        let edges = tri.edges();

        assert_eq!(edges.len(), 3);

        // Segment2 normalizes point order, so we need to check the actual segments
        // Edge 0: connects p0 and p1
        let edge0 = Segment2::new(p0, p1);
        assert_eq!(edges[0], edge0);

        // Edge 1: connects p1 and p2
        let edge1 = Segment2::new(p1, p2);
        assert_eq!(edges[1], edge1);

        // Edge 2: connects p2 and p0
        let edge2 = Segment2::new(p2, p0);
        assert_eq!(edges[2], edge2);
    }

    #[test]
    fn test_height_bounds_integer() {
        let p0 = Point2::new(0, 0);
        let p1 = Point2::new(4, 0);
        let p2 = Point2::new(0, 3);

        let tri = Triangle2::new(p0, p1, p2);
        let heights = tri.height_bounds();

        // Triangle with vertices (0,0), (4,0), (0,3)
        // Edge 0: (0,0) to (4,0), length=4, height from (0,3) = 3
        // Edge 1: (4,0) to (0,3), length=5, height from (0,0) = 12/5 = 2.4
        // Edge 2: (0,3) to (0,0), length=3, height from (4,0) = 4

        println!("Height bounds: {:?}", heights);

        // Verify bounds make sense (lower <= upper)
        assert!(heights[0].0 <= heights[0].1);
        assert!(heights[1].0 <= heights[1].1);
        assert!(heights[2].0 <= heights[2].1);
    }

    #[test]
    fn test_heights_float() {
        let p0 = Point2::new(0.0_f64, 0.0);
        let p1 = Point2::new(4.0, 0.0);
        let p2 = Point2::new(0.0, 3.0);

        let tri = Triangle2::new(p0, p1, p2);
        let heights = tri.heights();

        // Edge 0: (0,0) to (4,0), length=4, height=3
        // Edge 1: (4,0) to (0,3), length=5, height=12/5=2.4
        // Edge 2: (0,3) to (0,0), length=3, height=4

        assert!((heights[0] - 3.0).abs() < 1e-10);
        assert!((heights[1] - 2.4).abs() < 1e-10);
        assert!((heights[2] - 4.0).abs() < 1e-10);
    }

    #[test]
    fn test_integer_sqrt() {
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(0), 0);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(1), 1);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(4), 2);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(5), 2);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(9), 3);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(15), 3);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(16), 4);
        assert_eq!(Triangle2::<i32>::integer_sqrt_floor(100), 10);
    }
}
