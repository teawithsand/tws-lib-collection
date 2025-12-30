use nalgebra::Point2;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct AARect2<T>
where
    T: nalgebra::Scalar,
{
    min: Point2<T>,
    max: Point2<T>,
}

impl<T> AARect2<T>
where
    T: nalgebra::Scalar + PartialOrd,
{
    /// Creates an axis-aligned rectangle from any two corners.
    /// Corners are normalized so that `min` is the bottom-left and `max` is the top-right.
    pub fn new(corner_one: Point2<T>, corner_two: Point2<T>) -> Self {
        let (min_x, max_x) = if corner_one.x <= corner_two.x {
            (corner_one.x.clone(), corner_two.x.clone())
        } else {
            (corner_two.x.clone(), corner_one.x.clone())
        };
        let (min_y, max_y) = if corner_one.y <= corner_two.y {
            (corner_one.y.clone(), corner_two.y.clone())
        } else {
            (corner_two.y.clone(), corner_one.y.clone())
        };

        Self {
            min: Point2::new(min_x, min_y),
            max: Point2::new(max_x, max_y),
        }
    }

    /// Creates a rectangle assuming the provided points are already ordered as min/max.
    pub fn from_min_max(min: Point2<T>, max: Point2<T>) -> Self {
        assert!(min.x <= max.x, "min.x must be <= max.x");
        assert!(min.y <= max.y, "min.y must be <= max.y");
        Self { min, max }
    }

    pub fn min(&self) -> Point2<T> {
        self.min.clone()
    }

    pub fn max(&self) -> Point2<T> {
        self.max.clone()
    }

    pub fn corners(&self) -> (Point2<T>, Point2<T>) {
        (self.min.clone(), self.max.clone())
    }

    pub fn contains_point(&self, point: &Point2<T>) -> bool {
        point.x >= self.min.x
            && point.x <= self.max.x
            && point.y >= self.min.y
            && point.y <= self.max.y
    }

    pub fn intersects(&self, other: &Self) -> bool {
        !(self.max.x < other.min.x
            || other.max.x < self.min.x
            || self.max.y < other.min.y
            || other.max.y < self.min.y)
    }
}

impl<T> AARect2<T>
where
    T: nalgebra::Scalar + std::ops::Sub<Output = T>,
{
    pub fn width(&self) -> T {
        self.max.x.clone() - self.min.x.clone()
    }

    pub fn height(&self) -> T {
        self.max.y.clone() - self.min.y.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_corners() {
        let rect = AARect2::new(Point2::new(5, 10), Point2::new(-2, 3));
        assert_eq!(rect.min(), Point2::new(-2, 3));
        assert_eq!(rect.max(), Point2::new(5, 10));
    }

    #[test]
    fn width_and_height() {
        let rect = AARect2::new(Point2::new(0, 0), Point2::new(10, 4));
        assert_eq!(rect.width(), 10);
        assert_eq!(rect.height(), 4);
    }

    #[test]
    fn contains_edges_inclusive() {
        let rect = AARect2::new(Point2::new(-5, -5), Point2::new(5, 5));
        assert!(rect.contains_point(&Point2::new(-5, -5)));
        assert!(rect.contains_point(&Point2::new(5, 5)));
        assert!(!rect.contains_point(&Point2::new(6, 0)));
    }

    #[test]
    fn contains_and_intersects() {
        let rect = AARect2::new(Point2::new(0, 0), Point2::new(10, 10));
        assert!(rect.contains_point(&Point2::new(5, 5)));
        assert!(rect.contains_point(&Point2::new(0, 0)));
        assert!(!rect.contains_point(&Point2::new(11, 5)));

        let overlapping = AARect2::new(Point2::new(5, 5), Point2::new(15, 15));
        let disjoint = AARect2::new(Point2::new(20, 20), Point2::new(25, 25));
        assert!(rect.intersects(&overlapping));
        assert!(!rect.intersects(&disjoint));
    }

    #[test]
    fn intersects_when_touching_edges() {
        let left = AARect2::new(Point2::new(0, 0), Point2::new(10, 10));
        let right = AARect2::new(Point2::new(10, 0), Point2::new(20, 10));
        // Edges touch at x = 10; should count as intersecting.
        assert!(left.intersects(&right));
    }

    #[test]
    fn zero_width_or_height_rectangles() {
        let vertical_line = AARect2::new(Point2::new(5, 0), Point2::new(5, 10));
        assert_eq!(vertical_line.width(), 0);
        assert_eq!(vertical_line.height(), 10);
        assert!(vertical_line.contains_point(&Point2::new(5, 5)));

        let horizontal_line = AARect2::new(Point2::new(0, 7), Point2::new(10, 7));
        assert_eq!(horizontal_line.height(), 0);
        assert!(horizontal_line.intersects(&vertical_line));
    }

    #[test]
    #[should_panic(expected = "min.x must be <= max.x")]
    fn from_min_max_panics_on_invalid_order() {
        let _ = AARect2::from_min_max(Point2::new(5, 0), Point2::new(0, 5));
    }
}
