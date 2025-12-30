use std::convert::TryFrom;
use std::hash::Hash;

pub trait HandleType: Copy + Clone + Eq + Hash + PartialOrd + Ord + std::fmt::Debug {
    fn to_usize(self) -> usize;
    fn from_usize(n: usize) -> Option<Self>;
    fn next(self) -> Self;
    fn zero() -> Self;
    fn one() -> Self;
}

impl HandleType for u32 {
    #[inline]
    fn to_usize(self) -> usize {
        self as usize
    }

    #[inline]
    fn from_usize(n: usize) -> Option<Self> {
        u32::try_from(n).ok()
    }

    #[inline]
    fn next(self) -> Self {
        self.checked_add(1)
            .expect("Registry handle overflow: no more u32 handles available")
    }

    #[inline]
    fn zero() -> Self {
        0
    }

    #[inline]
    fn one() -> Self {
        1
    }
}

impl HandleType for u64 {
    #[inline]
    fn to_usize(self) -> usize {
        self as usize
    }

    #[inline]
    fn from_usize(n: usize) -> Option<Self> {
        Some(n as u64)
    }

    #[inline]
    fn next(self) -> Self {
        self.checked_add(1)
            .expect("Registry handle overflow: no more u64 handles available")
    }

    #[inline]
    fn zero() -> Self {
        0
    }

    #[inline]
    fn one() -> Self {
        1
    }
}

impl HandleType for usize {
    #[inline]
    fn to_usize(self) -> usize {
        self
    }

    #[inline]
    fn from_usize(n: usize) -> Option<Self> {
        Some(n)
    }

    #[inline]
    fn next(self) -> Self {
        self.checked_add(1)
            .expect("Registry handle overflow: no more usize handles available")
    }

    #[inline]
    fn zero() -> Self {
        0
    }

    #[inline]
    fn one() -> Self {
        1
    }
}
