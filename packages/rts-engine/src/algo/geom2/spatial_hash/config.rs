/// Behavior when a cell coordinate is out of bounds.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum OutOfBoundsBehavior {
    /// Silently ignore out-of-bounds cells (current behavior).
    /// Shapes partially outside the grid are only indexed for cells that fit.
    /// Queries extending beyond the grid only search cells that exist.
    #[default]
    Optimistic,

    /// Return an error when any cell coordinate is out of bounds.
    /// This is useful for debugging or when strict bounds are required.
    Fail,
}

/// Configuration for a spatial hash map.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct SpatialHashMapConfig {
    /// What to do when a cell coordinate is out of bounds.
    pub out_of_bounds: OutOfBoundsBehavior,
}

impl SpatialHashMapConfig {
    /// Create a new configuration with the given out-of-bounds behavior.
    pub fn new(out_of_bounds: OutOfBoundsBehavior) -> Self {
        Self { out_of_bounds }
    }

    /// Create an optimistic configuration (silently ignore out-of-bounds).
    pub fn optimistic() -> Self {
        Self {
            out_of_bounds: OutOfBoundsBehavior::Optimistic,
        }
    }

    /// Create a strict configuration (fail on out-of-bounds).
    pub fn strict() -> Self {
        Self {
            out_of_bounds: OutOfBoundsBehavior::Fail,
        }
    }
}
