use crate::path::MapCoordinate;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Fraction {
    pub n: MapCoordinate,
    pub d: MapCoordinate,
}

impl Fraction {
    pub fn new(n: MapCoordinate, d: MapCoordinate) -> Self {
        if d == 0 {
            panic!("Fraction denominator cannot be zero");
        }
        let g = Self::gcd(n.abs(), d.abs());
        let mut n = n / g;
        let mut d = d / g;
        if d < 0 {
            n = -n;
            d = -d;
        }
        Self { n, d }
    }

    pub const fn from_int(n: MapCoordinate) -> Self {
        Self { n, d: 1 }
    }

    fn gcd(mut a: MapCoordinate, mut b: MapCoordinate) -> MapCoordinate {
        while b != 0 {
            let temp = b;
            b = a % b;
            a = temp;
        }
        a
    }

    #[allow(dead_code)]
    pub const fn is_whole_number(&self) -> bool {
        self.d == 1
    }

    pub fn floor(&self) -> MapCoordinate {
        if self.n >= 0 {
            self.n / self.d
        } else {
            (self.n - self.d + 1) / self.d
        }
    }

    pub fn ceil(&self) -> MapCoordinate {
        if self.n >= 0 {
            (self.n + self.d - 1) / self.d
        } else {
            self.n / self.d
        }
    }

    pub fn to_float(&self) -> f32 {
        self.n as f32 / self.d as f32
    }

    pub fn is_less_than(&self, other: &Self) -> bool {
        (self.n as i64) * (other.d as i64) < (other.n as i64) * (self.d as i64)
    }

    #[allow(dead_code)]
    pub fn is_less_than_or_equal(&self, other: &Self) -> bool {
        (self.n as i64) * (other.d as i64) <= (other.n as i64) * (self.d as i64)
    }

    pub fn is_less_than_int(&self, x: MapCoordinate) -> bool {
        self.n < x * self.d
    }

    pub fn is_less_than_or_equal_int(&self, x: MapCoordinate) -> bool {
        self.n <= x * self.d
    }

    #[allow(dead_code)]
    pub fn plus(&self, other: &Self) -> Self {
        Self::new(self.n * other.d + other.n * self.d, self.d * other.d)
    }

    pub fn plus_int(&self, value: MapCoordinate) -> Self {
        Self::new(self.n + value * self.d, self.d)
    }

    #[allow(dead_code)]
    pub fn minus(&self, other: &Self) -> Self {
        Self::new(self.n * other.d - other.n * self.d, self.d * other.d)
    }

    pub fn minus_int(&self, value: MapCoordinate) -> Self {
        Self::new(self.n - value * self.d, self.d)
    }

    pub fn multiply_divide(&self, multiply: MapCoordinate, divide: MapCoordinate) -> Self {
        Self::new(self.n * multiply, self.d * divide)
    }
}

impl Eq for Fraction {}

impl std::hash::Hash for Fraction {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.n.hash(state);
        self.d.hash(state);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_reduces_to_lowest_terms() {
        let f = Fraction::new(6, 9);
        assert_eq!(f.n, 2);
        assert_eq!(f.d, 3);
    }

    #[test]
    fn new_normalizes_sign() {
        let f = Fraction::new(-6, -9);
        assert_eq!(f.n, 2);
        assert_eq!(f.d, 3);

        let f = Fraction::new(6, -9);
        assert_eq!(f.n, -2);
        assert_eq!(f.d, 3);
    }

    #[test]
    fn floor_and_ceil_work() {
        let f = Fraction::new(7, 3);
        assert_eq!(f.floor(), 2);
        assert_eq!(f.ceil(), 3);

        let f = Fraction::new(-7, 3);
        assert_eq!(f.floor(), -3);
        assert_eq!(f.ceil(), -2);
    }

    #[test]
    fn arithmetic_operations_work() {
        let a = Fraction::new(1, 2);
        let b = Fraction::new(1, 3);

        let sum = a.plus(&b);
        assert_eq!(sum, Fraction::new(5, 6));

        let diff = a.minus(&b);
        assert_eq!(diff, Fraction::new(1, 6));
    }

    #[test]
    fn comparisons_work() {
        let a = Fraction::new(1, 2);
        let b = Fraction::new(2, 3);

        assert!(a.is_less_than(&b));
        assert!(!b.is_less_than(&a));
        assert!(a.is_less_than_or_equal(&b));
        assert!(a.is_less_than_or_equal(&a));
    }

    #[test]
    fn from_int_creates_whole_number() {
        let f = Fraction::from_int(5);
        assert_eq!(f.n, 5);
        assert_eq!(f.d, 1);
        assert!(f.is_whole_number());
    }

    #[test]
    fn multiply_divide_for_projections() {
        let f = Fraction::new(3, 2);
        let result = f.multiply_divide(4, 3);
        assert_eq!(result, Fraction::new(2, 1));
    }
}
