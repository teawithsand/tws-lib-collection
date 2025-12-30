use std::convert::TryInto;

pub trait SpatialHashMapCoord: 'static + Clone + Copy {
    fn get_cell_index(self, cell_dim_divider: Self) -> Self;
    fn into_usize_checked(self) -> Option<usize>;
    fn spatial_saturating_add(self, rhs: Self) -> Self;
    fn positive_or_zero(self) -> Self;
    fn checked_mul(self, rhs: Self) -> Option<Self>;
    fn checked_add(self, rhs: Self) -> Option<Self>;
}

macro_rules! impl_spatial_hash_coord {
    ($($t:ty),*) => {
        $(
            impl SpatialHashMapCoord for $t {
                #[inline]
                fn get_cell_index(self, cell_dim_divider: Self) -> Self {
                    self / cell_dim_divider
                }

                #[inline]
                fn into_usize_checked(self) -> Option<usize> {
                    self.try_into().ok()
                }

                #[inline]
                fn spatial_saturating_add(self, rhs: Self) -> Self {
                    self.saturating_add(rhs)
                }

                #[inline]
                fn positive_or_zero(self) -> Self {
                    self.max(0)
                }

                #[inline]
                fn checked_mul(self, rhs: Self) -> Option<Self> {
                    <$t>::checked_mul(self, rhs)
                }

                #[inline]
                fn checked_add(self, rhs: Self) -> Option<Self> {
                    <$t>::checked_add(self, rhs)
                }
            }
        )*
    };
}

impl_spatial_hash_coord!(i8, i16, i32, i64, i128, isize, u8, u16, u32, u64, u128, usize);

// Floating point implementations use floor division
impl SpatialHashMapCoord for f32 {
    #[inline]
    fn get_cell_index(self, cell_dim_divider: Self) -> Self {
        (self / cell_dim_divider).floor()
    }

    #[inline]
    fn into_usize_checked(self) -> Option<usize> {
        if self >= 0.0 && self <= usize::MAX as f32 && self.is_finite() {
            Some(self as usize)
        } else {
            None
        }
    }

    #[inline]
    fn spatial_saturating_add(self, rhs: Self) -> Self {
        self + rhs
    }

    #[inline]
    fn positive_or_zero(self) -> Self {
        self.max(0.0)
    }

    #[inline]
    fn checked_mul(self, rhs: Self) -> Option<Self> {
        let result = self * rhs;
        if result.is_finite() {
            Some(result)
        } else {
            None
        }
    }

    #[inline]
    fn checked_add(self, rhs: Self) -> Option<Self> {
        let result = self + rhs;
        if result.is_finite() {
            Some(result)
        } else {
            None
        }
    }
}

impl SpatialHashMapCoord for f64 {
    #[inline]
    fn get_cell_index(self, cell_dim_divider: Self) -> Self {
        (self / cell_dim_divider).floor()
    }

    #[inline]
    fn into_usize_checked(self) -> Option<usize> {
        if self >= 0.0 && self <= usize::MAX as f64 && self.is_finite() {
            Some(self as usize)
        } else {
            None
        }
    }

    #[inline]
    fn spatial_saturating_add(self, rhs: Self) -> Self {
        self + rhs
    }

    #[inline]
    fn positive_or_zero(self) -> Self {
        self.max(0.0)
    }

    #[inline]
    fn checked_mul(self, rhs: Self) -> Option<Self> {
        let result = self * rhs;
        if result.is_finite() {
            Some(result)
        } else {
            None
        }
    }

    #[inline]
    fn checked_add(self, rhs: Self) -> Option<Self> {
        let result = self + rhs;
        if result.is_finite() {
            Some(result)
        } else {
            None
        }
    }
}
