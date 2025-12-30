use nalgebra::Point2;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct Segment2<T>
where
    T: nalgebra::Scalar,
{
    points: [Point2<T>; 2],
}

impl<T> Segment2<T>
where
    T: nalgebra::Scalar + PartialOrd,
{
    pub fn new(p1: Point2<T>, p2: Point2<T>) -> Self {
        let points = if (p1.x < p2.x) || (p1.x == p2.x && p1.y <= p2.y) {
            [p1, p2]
        } else {
            [p2, p1]
        };
        Self { points }
    }

    pub fn from(points: [Point2<T>; 2]) -> Self {
        Self::new(points[0].clone(), points[1].clone())
    }
}

impl<T> Segment2<T>
where
    T: nalgebra::Scalar,
{
    pub fn start(&self) -> Point2<T> {
        self.points[0].clone()
    }

    pub fn end(&self) -> Point2<T> {
        self.points[1].clone()
    }

    pub fn into(self) -> [Point2<T>; 2] {
        self.points
    }

    pub fn into_tuple(self) -> (Point2<T>, Point2<T>) {
        (self.points[0].clone(), self.points[1].clone())
    }

    pub fn into_array(self) -> [Point2<T>; 2] {
        self.points
    }
}

// Geometric computations - requires arithmetic operations
impl<T> Segment2<T>
where
    T: nalgebra::Scalar
        + std::ops::Sub<Output = T>
        + std::ops::Mul<Output = T>
        + std::ops::Add<Output = T>,
{
    pub fn square_length(&self) -> T {
        let dx = self.points[1].x.clone() - self.points[0].x.clone();
        let dy = self.points[1].y.clone() - self.points[0].y.clone();
        dx.clone() * dx + dy.clone() * dy
    }
}

impl<T> PartialOrd for Segment2<T>
where
    T: nalgebra::Scalar + Copy + Ord,
{
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl<T> Ord for Segment2<T>
where
    T: nalgebra::Scalar + Copy + Ord,
{
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Compare first point, then second point
        match (
            self.points[0].x.cmp(&other.points[0].x),
            self.points[0].y.cmp(&other.points[0].y),
        ) {
            (std::cmp::Ordering::Equal, std::cmp::Ordering::Equal) => {
                // First points are equal, compare second points
                match (
                    self.points[1].x.cmp(&other.points[1].x),
                    self.points[1].y.cmp(&other.points[1].y),
                ) {
                    (std::cmp::Ordering::Equal, y_ord) => y_ord,
                    (x_ord, _) => x_ord,
                }
            }
            (std::cmp::Ordering::Equal, y_ord) => y_ord,
            (x_ord, _) => x_ord,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::Point2;

    #[test]
    fn points_ordering_is_consistent() {
        type MC = i32;

        let p1: Point2<MC> = Point2::new(10 as MC, 20 as MC);
        let p2: Point2<MC> = Point2::new(5 as MC, 30 as MC);

        let e1 = Segment2::<MC>::new(p1, p2);
        let e2 = Segment2::<MC>::new(p2, p1);

        assert_eq!(e1, e2, "Edges with swapped points should be equal");

        let s = e1.start();
        let t = e1.end();

        assert!(
            s.coords.x < t.coords.x || (s.coords.x == t.coords.x && s.coords.y <= t.coords.y),
            "Edge start must be <= end lexicographically"
        );

        let arr = e1.into_array();
        assert_eq!(arr[0], s);
        assert_eq!(arr[1], t);
    }
}

#[cfg(test)]
mod hash_tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_hash_with_i32() {
        let p1 = Point2::<i32>::new(0, 0);
        let p2 = Point2::<i32>::new(1, 1);
        let seg1 = Segment2::new(p1, p2);
        let seg2 = Segment2::new(p1, p2);

        let mut set = HashSet::new();
        set.insert(seg1);
        set.insert(seg2); // Should not add duplicate

        assert_eq!(
            set.len(),
            1,
            "HashSet should contain only 1 element (no duplicates)"
        );
    }
}
