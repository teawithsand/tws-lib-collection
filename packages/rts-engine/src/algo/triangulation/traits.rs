use super::error::TriangulationError;
use std::convert::TryFrom;
use std::fmt::Debug;
use std::hash::Hash;

pub trait MathType:
    Copy
    + Debug
    + Ord
    + std::ops::Add<Output = Self>
    + std::ops::Sub<Output = Self>
    + std::ops::Mul<Output = Self>
    + 'static
{
    fn checked_add(self, rhs: Self) -> Option<Self>;
    fn checked_sub(self, rhs: Self) -> Option<Self>;
    fn checked_mul(self, rhs: Self) -> Option<Self>;
    fn checked_div(self, rhs: Self) -> Option<Self>;
    fn from_i32(n: i32) -> Self;
    fn zero() -> Self;
}

pub trait CoordType: Copy + Debug + Ord + Eq + Hash + 'static {
    type Math: MathType;

    fn to_math(self) -> Self::Math;
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError>;
    fn abs(self) -> Self;
    fn min_value() -> Self;
    fn max_value() -> Self;
}

pub trait IndexType: Copy + Debug + Ord + Eq + Hash + 'static {
    fn to_usize(self) -> usize;
    fn from_usize(n: usize) -> Option<Self>;
    fn max_value() -> Self;
}

macro_rules! impl_math_type {
    ($($t:ty),*) => {
        $(
            impl MathType for $t {
                #[inline]
                fn checked_add(self, rhs: Self) -> Option<Self> {
                    <$t>::checked_add(self, rhs)
                }

                #[inline]
                fn checked_sub(self, rhs: Self) -> Option<Self> {
                    <$t>::checked_sub(self, rhs)
                }

                #[inline]
                fn checked_mul(self, rhs: Self) -> Option<Self> {
                    <$t>::checked_mul(self, rhs)
                }

                #[inline]
                fn checked_div(self, rhs: Self) -> Option<Self> {
                    <$t>::checked_div(self, rhs)
                }

                #[inline]
                fn from_i32(n: i32) -> Self {
                    n as $t
                }

                #[inline]
                fn zero() -> Self {
                    0
                }
            }
        )*
    };
}

impl_math_type!(i32, i64, i128, u32, u64);

impl CoordType for i16 {
    type Math = i32;

    #[inline]
    fn to_math(self) -> Self::Math {
        self as i32
    }

    #[inline]
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError> {
        i16::try_from(m).map_err(|_| TriangulationError::ArithmeticOverflow {
            operation: "i32 to i16 conversion",
        })
    }

    #[inline]
    fn abs(self) -> Self {
        self.abs()
    }

    #[inline]
    fn min_value() -> Self {
        i16::MIN
    }

    #[inline]
    fn max_value() -> Self {
        i16::MAX
    }
}

impl CoordType for i32 {
    type Math = i64;

    #[inline]
    fn to_math(self) -> Self::Math {
        self as i64
    }

    #[inline]
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError> {
        i32::try_from(m).map_err(|_| TriangulationError::ArithmeticOverflow {
            operation: "i64 to i32 conversion",
        })
    }

    #[inline]
    fn abs(self) -> Self {
        self.abs()
    }

    #[inline]
    fn min_value() -> Self {
        i32::MIN
    }

    #[inline]
    fn max_value() -> Self {
        i32::MAX
    }
}

impl CoordType for i64 {
    type Math = i64;

    #[inline]
    fn to_math(self) -> Self::Math {
        self
    }

    #[inline]
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError> {
        Ok(m)
    }

    #[inline]
    fn abs(self) -> Self {
        self.abs()
    }

    #[inline]
    fn min_value() -> Self {
        i64::MIN
    }

    #[inline]
    fn max_value() -> Self {
        i64::MAX
    }
}

impl CoordType for u16 {
    type Math = u32;

    #[inline]
    fn to_math(self) -> Self::Math {
        self as u32
    }

    #[inline]
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError> {
        u16::try_from(m).map_err(|_| TriangulationError::ArithmeticOverflow {
            operation: "u32 to u16 conversion",
        })
    }

    #[inline]
    fn abs(self) -> Self {
        self
    }

    #[inline]
    fn min_value() -> Self {
        u16::MIN
    }

    #[inline]
    fn max_value() -> Self {
        u16::MAX
    }
}

impl CoordType for u32 {
    type Math = u64;

    #[inline]
    fn to_math(self) -> Self::Math {
        self as u64
    }

    #[inline]
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError> {
        u32::try_from(m).map_err(|_| TriangulationError::ArithmeticOverflow {
            operation: "u64 to u32 conversion",
        })
    }

    #[inline]
    fn abs(self) -> Self {
        self
    }

    #[inline]
    fn min_value() -> Self {
        u32::MIN
    }

    #[inline]
    fn max_value() -> Self {
        u32::MAX
    }
}

impl CoordType for u64 {
    type Math = u64;

    #[inline]
    fn to_math(self) -> Self::Math {
        self
    }

    #[inline]
    fn from_math(m: Self::Math) -> Result<Self, TriangulationError> {
        Ok(m)
    }

    #[inline]
    fn abs(self) -> Self {
        self
    }

    #[inline]
    fn min_value() -> Self {
        u64::MIN
    }

    #[inline]
    fn max_value() -> Self {
        u64::MAX
    }
}

impl IndexType for usize {
    #[inline]
    fn to_usize(self) -> usize {
        self
    }

    #[inline]
    fn from_usize(n: usize) -> Option<Self> {
        Some(n)
    }

    #[inline]
    fn max_value() -> Self {
        usize::MAX
    }
}

impl IndexType for u32 {
    #[inline]
    fn to_usize(self) -> usize {
        self as usize
    }

    #[inline]
    fn from_usize(n: usize) -> Option<Self> {
        u32::try_from(n).ok()
    }

    #[inline]
    fn max_value() -> Self {
        u32::MAX
    }
}

impl IndexType for u16 {
    #[inline]
    fn to_usize(self) -> usize {
        self as usize
    }

    #[inline]
    fn from_usize(n: usize) -> Option<Self> {
        u16::try_from(n).ok()
    }

    #[inline]
    fn max_value() -> Self {
        u16::MAX
    }
}
